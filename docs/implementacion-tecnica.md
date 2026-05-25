# Implementación técnica — MakiCar
## Guía para adaptar este sistema a otro negocio de transporte a demanda

---

## 1. Concepto del sistema

MakiCar es una **PWA (Progressive Web App)** que conecta conductores con pasajeros para rutas regulares y servicios especiales a medida. El conductor gestiona su oferta (viajes, reservas, precios) y los pasajeros reservan plaza en tiempo real.

**El modelo es extrapolable a cualquier negocio donde:**
- Un proveedor ofrece un servicio con capacidad limitada (plazas, horas, productos)
- El cliente reserva y el proveedor confirma o rechaza
- El precio puede ser fijo (según tabla) o a consultar (ad hoc)
- El operador de la plataforma cobra una cuota al proveedor (facturación B2B)

---

## 2. Stack tecnológico

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Framework | **Next.js 16 App Router** | Server actions sin API REST explícita, SSR, ISR |
| Lenguaje | **TypeScript** | Tipos end-to-end con los generados por Supabase |
| Estilos | **Tailwind CSS** | Tokens de diseño como variables CSS, dark theme |
| Base de datos | **Supabase (PostgreSQL)** | Auth, RLS, triggers, realtime out-of-the-box |
| Email | **Resend** | API simple, buena entregabilidad |
| Pagos pasajero→conductor | **Stripe Connect** (pendiente en v1) | Cada conductor tiene su cuenta Stripe |
| Pagos operador→conductor | **Stripe** (cuenta propia del operador) | Facturación mensual a conductores |
| Despliegue | **Vercel** | Integración nativa con Next.js, serverless, CI/CD automático |

---

## 3. Arquitectura general

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (edge)                     │
│                                                     │
│  Next.js App Router                                 │
│  ├── Server Components  → consultan Supabase        │
│  ├── Server Actions     → mutan datos               │
│  └── Client Components → interactividad UI          │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │   Supabase (PostgreSQL) │
        │   ├── Auth (JWT)        │
        │   ├── RLS por rol       │
        │   ├── Triggers SQL      │
        │   └── Edge Functions    │
        └─────────────────────────┘
```

**Flujo de datos:**
1. El navegador carga Server Components que leen datos en el servidor (sin API round-trip)
2. Las acciones de usuario disparan Server Actions (`'use server'`) que mutan la BD directamente
3. Supabase gestiona auth, permisos (RLS) y consistencia (triggers)
4. Vercel revalida el caché de la página al terminar cada acción (`revalidatePath`)

---

## 4. Estructura de carpetas

```
src/
├── app/
│   ├── (rutas del pasajero)
│   │   ├── page.tsx              ← Home: lista viajes disponibles
│   │   ├── reservar/[id]/        ← Formulario de reserva
│   │   ├── mis-viajes/           ← Historial y cancelaciones
│   │   └── especial/             ← Solicitud de servicio a medida
│   ├── conductor/                ← Panel del conductor
│   │   ├── page.tsx              ← Dashboard principal
│   │   ├── actions.ts            ← Todas las mutaciones del conductor
│   │   └── TripForm.tsx          ← Formulario crear/editar viaje
│   ├── admin/                    ← Panel superadmin del operador
│   │   ├── page.tsx
│   │   └── actions.ts            ← Crear/eliminar conductores + Stripe
│   ├── api/
│   │   └── webhooks/
│   │       └── makicar-stripe/   ← Webhook Stripe del operador
│   └── login/, unirse/, perfil/, confirmacion/, conductores/
├── components/
│   ├── DateTimePicker.tsx        ← Calendario flotante reutilizable
│   ├── BottomTabs.tsx            ← Navegación inferior (PWA)
│   ├── AutoRefresh.tsx           ← Refresco periódico silencioso
│   └── MakiCarLogo.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts             ← Cliente SSR con cookies de sesión
│   │   ├── admin.ts              ← Cliente con service_role (solo servidor)
│   │   └── types.ts              ← Tipos generados de la BD
│   ├── tarifas.ts                ← Motor de precios (puro, testeable)
│   ├── email.ts                  ← Todas las notificaciones (Resend)
│   ├── conductores.ts            ← Helper: obtener conductor activo
│   └── stripe/
│       └── makicar.ts            ← Cliente Stripe del operador
└── supabase/
    └── migrations/               ← SQL versionado (aplicar en orden)
        ├── 001_init.sql
        ├── 002_add_fecha_hora_booking.sql
        ├── ...
        └── 008_plazas_trigger.sql
```

---

## 5. Base de datos

### Esquema de tablas

```sql
-- Perfil de cualquier usuario (cliente o conductor)
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users,
  rol         text NOT NULL DEFAULT 'cliente', -- 'cliente' | 'conductor' | 'superadmin'
  nombre      text NOT NULL DEFAULT '',
  telefono    text,
  conductor_id uuid REFERENCES conductores(id), -- conductor asignado al pasajero
  created_at  timestamptz DEFAULT now()
);

-- Proveedor del servicio (conductor)
CREATE TABLE conductores (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid REFERENCES profiles(id),
  nombre_servicio  text NOT NULL,
  email            text,
  plazas_vehiculo  int NOT NULL DEFAULT 4,
  activo           boolean NOT NULL DEFAULT true,
  -- Facturación del operador
  makicar_stripe_customer_id         text,
  makicar_stripe_subscription_id     text,
  makicar_stripe_subscription_status text NOT NULL DEFAULT 'sin_suscripcion',
  created_at       timestamptz DEFAULT now()
);

-- Oferta de viaje (slot de tiempo con capacidad)
CREATE TABLE trips (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conductor_id      uuid REFERENCES conductores(id),
  fecha_hora        timestamptz NOT NULL,
  origen_cabecera   text NOT NULL,
  destino_cabecera  text NOT NULL,
  plazas_totales    int NOT NULL,
  plazas_libres     int NOT NULL,  -- mantenido por trigger
  precio            numeric NOT NULL DEFAULT 0,
  estado            text NOT NULL DEFAULT 'abierto', -- 'abierto' | 'cerrado'
  puntos_recogida   text[] DEFAULT '{}',
  puntos_llegada    text[] DEFAULT '{}',
  created_at        timestamptz DEFAULT now()
);

-- Reserva de un pasajero en un viaje
CREATE TABLE bookings (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id                uuid REFERENCES trips(id),  -- null = servicio especial
  conductor_id           uuid REFERENCES conductores(id),
  cliente_id             uuid REFERENCES profiles(id),
  fecha_hora_solicitada  timestamptz,
  origen                 text NOT NULL,
  destino                text NOT NULL,
  num_pasajeros          int NOT NULL DEFAULT 1,
  es_noche               boolean NOT NULL DEFAULT false,
  precio_base            numeric NOT NULL,
  maleta                 text NOT NULL DEFAULT 'no', -- 'no'|'maletero'|'asiento'
  mascota                text NOT NULL DEFAULT 'no', -- 'no'|'pies'|'asiento'
  suplementos            numeric NOT NULL DEFAULT 0,
  precio_total           numeric NOT NULL,
  forma_pago             text NOT NULL,  -- 'efectivo' | 'tarjeta'
  estado                 text NOT NULL DEFAULT 'pendiente',
  cancelada_at           timestamptz,
  penalizacion           numeric NOT NULL DEFAULT 0,
  created_at             timestamptz DEFAULT now()
);

-- Deudas por cancelación tardía
CREATE TABLE deudas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id   uuid REFERENCES profiles(id),
  conductor_id uuid REFERENCES conductores(id),
  booking_id   uuid REFERENCES bookings(id),
  importe      numeric NOT NULL,
  saldada      boolean NOT NULL DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

-- Servicios a medida (fuera de ruta estándar)
CREATE TABLE special_requests (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conductor_id            uuid REFERENCES conductores(id),
  cliente_id              uuid REFERENCES profiles(id),
  origen_texto            text NOT NULL,
  destino_texto           text NOT NULL,
  fecha_hora              timestamptz NOT NULL,
  num_pasajeros           int NOT NULL DEFAULT 1,
  precio_propuesto        numeric,   -- lo fija el conductor al aprobar
  forma_pago              text,
  estado                  text NOT NULL DEFAULT 'pendiente',
  created_at              timestamptz DEFAULT now()
);
```

### Row Level Security (RLS)

Supabase aplica permisos a nivel de fila. Cada tabla tiene RLS activado y políticas que determinan qué puede hacer cada rol:

```sql
-- Funciones helper (se usan dentro de las políticas)
CREATE FUNCTION es_conductor_activo() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
      SELECT 1 FROM conductores
      WHERE profile_id = auth.uid() AND activo = true
    );
  $$;

CREATE FUNCTION mi_conductor_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT id FROM conductores WHERE profile_id = auth.uid() AND activo = true LIMIT 1;
  $$;

-- Ejemplo de política: solo el conductor gestiona sus viajes
CREATE POLICY "trips_conductor_gestiona"
  ON trips FOR ALL
  USING (conductor_id = mi_conductor_id());

-- El pasajero solo ve sus propias reservas
CREATE POLICY "bookings_cliente_lee_suyos"
  ON bookings FOR SELECT
  USING (cliente_id = auth.uid());
```

**Regla de oro:** Cuando el código de la app necesita hacer una operación que RLS bloquea (ej: el pasajero actualiza `plazas_libres` en `trips`), se usa el cliente admin con `SUPABASE_SERVICE_ROLE_KEY` — pero **solo en server actions** (nunca en el cliente).

### Trigger de consistencia

Un trigger mantiene `plazas_libres` siempre sincronizado, sin depender del código de aplicación:

```sql
CREATE OR REPLACE FUNCTION sync_plazas_libres()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_trip_id uuid;
BEGIN
  v_trip_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.trip_id ELSE NEW.trip_id END;
  IF v_trip_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  UPDATE trips
  SET plazas_libres = GREATEST(0, plazas_totales - (
    SELECT COALESCE(SUM(num_pasajeros), 0) FROM bookings
    WHERE trip_id = v_trip_id AND estado IN ('pendiente', 'confirmada')
  ))
  WHERE id = v_trip_id;

  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER trg_sync_plazas_libres
  AFTER INSERT OR UPDATE OF estado, num_pasajeros OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION sync_plazas_libres();
```

---

## 6. Autenticación y roles

Supabase Auth gestiona el login/registro. Al crearse un usuario en Auth, un trigger crea automáticamente su fila en `profiles` con `rol = 'cliente'`.

**Tres roles:**
- `cliente` — Puede ver viajes de su conductor asignado y reservar
- `conductor` — Puede gestionar sus viajes, ver y gestionar reservas
- `superadmin` — Panel de administración; crea/elimina conductores; sin RLS (usa service role)

**Vinculación conductor-pasajero:** En v1 (un solo conductor), al hacer su primera reserva el pasajero queda vinculado a ese conductor (`profiles.conductor_id`). Los pasajeros solo ven viajes de su conductor asignado. Si no tienen conductor, ven una pantalla de "sin conductor".

**Clientes Supabase:**
```typescript
// Para operaciones del usuario (respeta RLS)
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();

// Para operaciones administrativas (bypass RLS — solo en server actions)
import { createAdminClient } from '@/lib/supabase/admin';
const admin = createAdminClient();
```

---

## 7. Patrón Server Actions

Toda mutación de datos usa Server Actions de Next.js. No hay endpoints REST explícitos.

```typescript
// src/app/conductor/actions.ts
'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function confirmarReserva(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const bookingId = formData.get('booking_id') as string;

  await supabase.from('bookings')
    .update({ estado: 'confirmada' })
    .eq('id', bookingId);

  revalidatePath('/conductor'); // invalida la caché de la página
}
```

**Invocación desde el componente:**
```tsx
// Formulario con server action
<form action={confirmarReserva}>
  <input type="hidden" name="booking_id" value={b.id} />
  <button type="submit">Confirmar</button>
</form>
```

**Para acciones con feedback (errores, reseteo de form):**
```tsx
// Componente cliente con useRef para resetear
'use client';
import { useRef } from 'react';
import { crearViaje } from './actions';

export default function ViajeForm() {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={async (fd) => {
      await crearViaje(fd);
      formRef.current?.reset();
    }}>
      {/* campos */}
    </form>
  );
}
```

---

## 8. Motor de precios (extrapolable)

El motor de precios es una función pura en `src/lib/tarifas.ts`, sin dependencias externas. Fácil de testear y adaptar:

```typescript
// Estructura genérica del motor
type Parada = 'A' | 'B' | 'C' | 'D' | 'E';  // ajustar a tu negocio

const TABLA_PRECIOS: Record<string, [number, number]> = {
  'A-B': [15, 20],  // [precio_día, precio_noche]
  'A-C': [18, 22],
  // ...
};

const SIN_SERVICIO = new Set(['C-D']); // tramos bloqueados

function calcularPrecio({ origen, destino, fechaHora, extras }) {
  const clave = [origen, destino].sort().join('-');
  if (SIN_SERVICIO.has(clave)) throw new Error('Ruta no disponible');
  
  const hora = fechaHora.getHours();
  const esNoche = hora >= 21 || hora < 6;
  const [precioBase] = TABLA_PRECIOS[clave] ?? [];
  
  return { precioBase, esNoche, total: precioBase + calcularExtras(extras) };
}
```

**Para adaptar:** Solo cambia `TABLA_PRECIOS`, `SIN_SERVICIO` y la lógica de `esNoche`. El resto del sistema (form, acción, display) usa esta función sin modificaciones.

---

## 9. Sistema de emails (Resend)

Todas las notificaciones están centralizadas en `src/lib/email.ts`. El patrón es:

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

async function send(to: string, subject: string, html: string) {
  try {
    await resend.emails.send({
      from: 'MiApp <noreply@midominio.com>',
      to, subject, html,
    });
  } catch (err) {
    console.error('[Email]', err); // fallo silencioso — nunca rompe el flujo
  }
}

// Helper: obtener email de un usuario por su ID
async function emailDeUsuario(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: { user } } = await admin.auth.admin.getUserById(userId);
  return user?.email ?? null;
}
```

**Emails implementados:**
- Conductor recibe: nueva reserva, nueva solicitud especial
- Pasajero recibe: reserva confirmada/rechazada, servicio especial confirmado/rechazado, cancelación por baja del conductor

---

## 10. Facturación del operador (Stripe)

El operador cobra una cuota mensual a los conductores usando **su propia cuenta Stripe** (distinta de la cuenta con que el conductor cobra a pasajeros).

**Flujo al crear un conductor:**
```typescript
const stripe = new Stripe(process.env.MAKICAR_STRIPE_SECRET_KEY);

// 1. Crear cliente en Stripe
const customer = await stripe.customers.create({
  email, name, preferred_locales: ['es'],
  metadata: { profile_id: userId },
});

// 2a. Oferta lanzamiento: suscripción con cambio automático de precio al año
const schedule = await stripe.subscriptionSchedules.create({
  customer: customer.id, start_date: 'now', end_behavior: 'release',
  phases: [
    { items: [{ price: PRICE_LAUNCH }], end_date: ahoraPlus1Año,
      collection_method: 'send_invoice', invoice_settings: { days_until_due: 30 } },
    { items: [{ price: PRICE_STANDARD }],
      collection_method: 'send_invoice', invoice_settings: { days_until_due: 30 } },
  ],
});

// 2b. Estándar: suscripción + alta única en la primera factura
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: PRICE_STANDARD }],
  collection_method: 'send_invoice', days_until_due: 30,
  add_invoice_items: [{ price: PRICE_SETUP }], // cargo único de alta
});

// 3. Finalizar y enviar la primera factura inmediatamente
const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['latest_invoice'] });
const invoice = sub.latest_invoice as Stripe.Invoice;
if (invoice?.status === 'draft') await stripe.invoices.finalizeInvoice(invoice.id);
```

**Webhook para sincronizar estado de pago:**
`POST /api/webhooks/makicar-stripe` — verifica firma Stripe, actualiza `makicar_stripe_subscription_status` en `conductores`.

**Variables de entorno necesarias:**
```
MAKICAR_STRIPE_SECRET_KEY=sk_live_...
MAKICAR_STRIPE_WEBHOOK_SECRET=whsec_...
MAKICAR_STRIPE_PRICE_LAUNCH=price_...    # precio oferta lanzamiento
MAKICAR_STRIPE_PRICE_STANDARD=price_...  # precio estándar
MAKICAR_STRIPE_PRICE_SETUP=price_...     # cargo único de alta (opcional)
```

---

## 11. Componentes reutilizables clave

### DateTimePicker
Calendario flotante personalizado. Evita el `input type="datetime-local"` nativo (inconsistente entre navegadores y en modo oscuro).

```tsx
import DateTimePicker from '@/components/DateTimePicker';

const [fecha, setFecha] = useState('');
const [hora, setHora]   = useState('10:00');

<DateTimePicker
  fecha={fecha} hora={hora}
  minFecha={new Date().toISOString().split('T')[0]}
  onFecha={setFecha} onHora={setHora}
/>
// Luego pasar como hidden inputs al form:
<input type="hidden" name="fecha" value={fecha} />
<input type="hidden" name="hora"  value={hora} />
```

### AutoRefresh
Recarga silenciosa del router cada N segundos para que el pasajero vea cambios de disponibilidad en tiempo real sin usar websockets.

---

## 12. Variables de entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # nunca exponer al cliente

# Email
RESEND_API_KEY=re_...

# Stripe del operador (facturación a conductores)
MAKICAR_STRIPE_SECRET_KEY=sk_live_...
MAKICAR_STRIPE_WEBHOOK_SECRET=whsec_...
MAKICAR_STRIPE_PRICE_LAUNCH=price_...
MAKICAR_STRIPE_PRICE_STANDARD=price_...
MAKICAR_STRIPE_PRICE_SETUP=price_...

# Stripe del conductor (cobro a pasajeros — pendiente en v1)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 13. Despliegue

**Vercel** conectado al repositorio GitHub. El despliegue es automático al hacer merge a `main`.

1. Importar el repo en Vercel
2. Configurar todas las variables de entorno en el panel de Vercel
3. Configurar el dominio personalizado
4. En Stripe: añadir el endpoint del webhook `https://tudominio.com/api/webhooks/makicar-stripe` con los eventos `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`

---

## 14. Flujos de usuario principales

### Pasajero reserva un viaje
```
Home (lista viajes) → /reservar/[id] → formulario (destino, extras, pago)
→ Server Action: validar plazas + duplicado → insert booking + trigger decrementa plazas
→ redirect /confirmacion → conductor recibe email
```

### Conductor gestiona reservas
```
/conductor (dashboard) → ve reservas pendientes → confirmar/rechazar
→ Server Action → update booking.estado → pasajero recibe email
→ Si rechaza: trigger devuelve plazas automáticamente
```

### Pasajero cancela
```
/mis-viajes → botón cancelar (con aviso si < 24 h)
→ Server Action → booking = 'cancelada' + deuda si procede
→ admin client actualiza trips.plazas_libres (RLS lo bloquea al pasajero)
→ trigger también lo sincroniza como red de seguridad
```

### Operador crea conductor
```
/admin → formulario (nombre, email, teléfono)
→ Server Action: crear usuario en Auth → upsert profiles → insert conductores
→ Stripe: crear customer + suscripción + finalizar primera factura
→ Conductor recibe email de Stripe con factura
```

---

## 15. Checklist para adaptar a otro negocio

- [ ] Cambiar nombre y tokens de color en `tailwind.config` y `globals.css`
- [ ] Definir las "paradas" o categorías de tu servicio en `tarifas.ts`
- [ ] Ajustar la tabla de precios en `tarifas.ts`
- [ ] Revisar los campos de `bookings` (quitar/añadir según los extras de tu negocio)
- [ ] Adaptar los textos de emails en `email.ts`
- [ ] Configurar el dominio del remitente en Resend
- [ ] Crear los productos/precios en Stripe para la facturación del operador
- [ ] Aplicar las migraciones SQL en Supabase en orden (001 → 008)
- [ ] Configurar las variables de entorno en Vercel
- [ ] Configurar el webhook de Stripe en el panel de Stripe
