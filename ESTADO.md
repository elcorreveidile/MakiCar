# Estado actual del proyecto MakiCar

Este documento es un resumen de contexto para continuar el desarrollo. La **fuente de verdad de negocio** sigue siendo `docs/makicar-plan-desarrollo.md` y `CLAUDE.md`.

---

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (PostgreSQL + Auth) · Vercel

## Repositorio y despliegue

- **Repo:** `https://github.com/elcorreveidile/makicar`
- **Rama principal:** `main` (desplegada automáticamente en Vercel)
- **Supabase proyecto:** `wchzfowahoksisgygudz`

---

## Variables de entorno necesarias

En `.env.local` (local) y en Vercel → Settings → Environment Variables (producción):

```
NEXT_PUBLIC_SUPABASE_URL=https://wchzfowahoksisgygudz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_5g9utJNaswn-oc2-TXpR4w_Ale2iKba
NEXT_PUBLIC_SITE_URL=http://localhost:3000   ← en Vercel usar la URL real
SUPABASE_SERVICE_ROLE_KEY=eyJ...             ← Supabase → Settings → API → Service role key
```

**IMPORTANTE:** `.env.local` está en `.gitignore` y nunca se sube al repo.

---

## Roles de usuario

| Rol | Panel | Redirección al login |
|---|---|---|
| `cliente` | `/` (pasajero) | — |
| `conductor` | `/conductor` | — |
| `superadmin` | `/admin` | — |

El rol se guarda en `profiles.rol` (columna `text`). Se asigna manualmente en Supabase o mediante la acción `crearConductor` del panel admin.

---

## UUIDs importantes en Supabase (producción)

| Elemento | UUID |
|---|---|
| Conductor activo (`conductores.id`) | `178a494f-d6b6-4303-95a1-bc66017a9770` |
| Profile del conductor (makicarapp@gmail.com) | `c71cafc7-1dcf-44ea-b94d-0bafbd4cb9f8` |

---

## Funciones de Supabase (deben existir en Database → Functions)

```sql
-- Devuelve true si el usuario logueado es conductor activo
CREATE OR REPLACE FUNCTION public.es_conductor_activo()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'conductor'
  );
$$;

-- Devuelve el conductores.id del usuario logueado (multi-conductor)
CREATE OR REPLACE FUNCTION public.mi_conductor_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id FROM public.conductores
  WHERE profile_id = auth.uid() AND activo = true LIMIT 1;
$$;

-- Devuelve true si el usuario logueado es superadmin
CREATE OR REPLACE FUNCTION public.es_superadmin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'superadmin'
  );
$$;
```

---

## Esquema de tablas relevante

### `profiles`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | = `auth.users.id` |
| `rol` | text | `'cliente'` · `'conductor'` · `'superadmin'` |
| `nombre` | text | |
| `telefono` | text | nullable |
| `direccion_habitual_recogida` | text | nullable |
| `avatar_url` | text | nullable |
| `conductor_id` | uuid | FK → `conductores.id`; vincula pasajero a su conductor exclusivo |
| `created_at` | timestamptz | |

### `conductores`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `profile_id` | uuid | FK → `profiles.id` del usuario conductor |
| `nombre_servicio` | text | |
| `email` | text | nullable; se rellena al crear desde el panel admin |
| `plazas_vehiculo` | int | por defecto 4 |
| `stripe_account_id` | text | nullable; pendiente fase Stripe |
| `activo` | bool | |

### `trips`
Campos relevantes: `id`, `conductor_id`, `fecha_hora` (timestamptz almacenado en UTC), `origen_cabecera`, `destino_cabecera`, `plazas_totales`, `plazas_libres`, `precio`, `estado` (`'abierto'`·`'cerrado'`).

### `bookings`
Estados: `pendiente → confirmada / rechazada → completada / cancelada`.
Campos: `trip_id`, `conductor_id`, `cliente_id`, `precio_base`, `suplementos`, `precio_total`, `maleta`, `mascota`, `forma_pago`, `penalizacion`.

### `special_requests`, `deudas`
Ver `src/lib/supabase/types.ts` para el esquema completo.

---

## Estructura de rutas

```
/                    → pasajero: lista viajes de su conductor asignado
/login               → magic link (todos los roles)
/reservar/[id]       → formulario de reserva de un viaje concreto
/confirmacion        → página de éxito tras reservar
/mis-viajes          → pasajero: historial de reservas y cancelaciones
/perfil              → pasajero: editar perfil (nombre, teléfono, dirección)
/especial            → pasajero: solicitar servicio especial
/conductor           → panel del conductor (viajes, reservas, pasajeros, deudas)
/admin               → panel superadmin (listado y alta de conductores)
```

---

## Lógica clave implementada

### Tarifas
`src/lib/tarifas.ts` — tabla de precios por tramo día/noche, bidireccional (`claveNormalizada`). Tests en `src/lib/tarifas.test.ts` (Vitest).

### Suplementos (en `reservar/[id]/actions.ts`)
- Maleta maletero: +5 €
- Maleta asiento: +precio tramo completo
- Mascota pies: +5 €
- Mascota asiento: +precio tramo completo

### Zonas horarias
Todos los `fecha_hora` se almacenan en UTC en Supabase. **Todos los `formatFecha` deben usar `timeZone: 'UTC'`** para que conductor y pasajero vean la misma hora. Los componentes cliente (browser) añaden el offset local si no se fuerza UTC.

### Clientes exclusivos por conductor
`profiles.conductor_id` vincula cada pasajero a un conductor. Se asigna automáticamente en la primera reserva (`reservar/[id]/actions.ts`). La página `/` solo muestra viajes del conductor asignado; si `conductor_id` es null muestra mensaje "sin conductor asignado".

### Panel admin (`/admin`)
Usa `src/lib/supabase/admin.ts` (cliente con service role key) para crear usuarios en Supabase Auth (`admin.auth.admin.createUser`) y luego insertar en `profiles` y `conductores`. La `SUPABASE_SERVICE_ROLE_KEY` debe estar en las variables de entorno.

---

## Problemas pendientes y bugs conocidos

### 🔴 CRÍTICO: Panel `/admin` no funciona todavía

**Síntoma:** El usuario superadmin (`benitezl@go.ugr.es`) al hacer login es redirigido al panel de pasajero en lugar de a `/admin`.

**Causa probable:** El usuario `benitezl@go.ugr.es` no tiene fila en la tabla `profiles` (nunca ha completado el onboarding de pasajero), por lo que el UPDATE de rol no tuvo efecto y `page.tsx` recibe `profile = null`.

**Solución:** Ejecutar en Supabase → SQL Editor:

```sql
-- Paso 1: insertar el perfil si no existe
INSERT INTO public.profiles (id, rol, nombre)
SELECT id, 'superadmin', 'Admin'
FROM auth.users
WHERE email = 'benitezl@go.ugr.es'
ON CONFLICT (id) DO UPDATE SET rol = 'superadmin';
```

Si el usuario ni siquiera está en `auth.users` (nunca ha hecho login), primero debe hacer login con magic link en `/login` para que Supabase cree su registro, y luego ejecutar el SQL anterior.

### 🔴 CRÍTICO: `SUPABASE_SERVICE_ROLE_KEY` no añadida a Vercel

Sin esta variable la acción `crearConductor` fallará en producción. Añadirla en Vercel → Settings → Environment Variables y hacer redeploy.

### 🟡 PENDIENTE: `mi_conductor_id()` actualizada pero no verificada

Se cambió para usar `profile_id = auth.uid()` en lugar de `activo = true LIMIT 1`. Hay que verificar que el conductor existente (`makicarapp@gmail.com`) tiene `conductores.profile_id = 'c71cafc7-1dcf-44ea-b94d-0bafbd4cb9f8'`. Si el UPDATE de la sentencia 4 no se ejecutó, ejecutar:

```sql
UPDATE public.conductores
  SET profile_id = 'c71cafc7-1dcf-44ea-b94d-0bafbd4cb9f8'
  WHERE id = '178a494f-d6b6-4303-95a1-bc66017a9770';
```

### 🟡 PENDIENTE: Fases no implementadas

Según `docs/makicar-plan-desarrollo.md`:
- **Stripe:** pre-autorización de 15 € en reservas con tarjeta (variables `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ya tienen placeholder en `.env.local`)
- **Notificaciones email:** Resend (variable `RESEND_API_KEY` con placeholder)
- **Notificaciones WhatsApp:** fase 1.1, requiere API Business de Meta

### 🟡 PENDIENTE: Pasajeros sin conductor asignado

Los pasajeros que existían antes de implementar `profiles.conductor_id` tienen ese campo a `null` y verán la pantalla "sin conductor asignado". Solución: asignarlos manualmente en Supabase o dejar que se asignen solos en la próxima reserva.

### 🟡 MENOR: Zona horaria en `mis-viajes/page.tsx`

El `formatFecha` de `/mis-viajes` no tiene `timeZone: 'UTC'`. Añadirlo para consistencia:
```typescript
return new Date(iso).toLocaleString('es-ES', {
  ..., timeZone: 'UTC',
});
```

---

## Archivos clave

| Archivo | Qué hace |
|---|---|
| `src/lib/supabase/types.ts` | Tipos TypeScript del esquema de Supabase |
| `src/lib/supabase/admin.ts` | Cliente Supabase con service role (solo server actions) |
| `src/lib/tarifas.ts` | Motor de precios (tabla + suplementos + validación) |
| `src/app/page.tsx` | Home del pasajero |
| `src/app/conductor/page.tsx` | Panel del conductor |
| `src/app/conductor/actions.ts` | Acciones del conductor (crear/editar/cerrar viajes, gestionar reservas) |
| `src/app/conductor/TripCard.tsx` | Tarjeta de viaje con edición inline |
| `src/app/admin/page.tsx` | Panel superadmin |
| `src/app/admin/actions.ts` | Alta de conductores, toggle activo/inactivo |
| `src/app/reservar/[id]/actions.ts` | Reservar plaza + vincular pasajero a conductor |
| `src/middleware.ts` | Protección de rutas con Supabase SSR |
