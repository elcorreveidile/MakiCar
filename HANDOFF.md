# MakiCar — Briefing para agente nuevo

Lee este archivo al inicio de la sesión. La fuente de verdad completa está en
`docs/makicar-plan-desarrollo.md`. Las reglas de negocio están en `CLAUDE.md`.

---

## Estado actual del proyecto

| Fase | Estado |
|------|--------|
| 0 — Andamiaje Next.js | ✅ Completa |
| 1 — Motor de tarifas + tests | ✅ Completa (26 tests, PR mergeado) |
| 2 — Schema Supabase + RLS | ✅ Completa (PR #4 en revisión) |
| 3 — Pantallas cliente MVP | ✅ Completa (PR #4 en revisión) |
| 4 — Panel del conductor | 🔜 Siguiente |

El PR #4 en GitHub (`elcorreveidile/MakiCar`, rama `claude/makicar-pricing-engine-rsTmT`)
cubre Fases 2 y 3. Espera aprobación del usuario antes de arrancar la Fase 4.

---

## Stack y herramientas

- **Framework**: Next.js 16, App Router, TypeScript, Tailwind CSS v3
- **Backend**: Supabase (PostgreSQL + Auth + RLS), `@supabase/ssr` v0.10.3
- **Tests**: Vitest v4 (`npx vitest run`)
- **Tipos**: `npx tsc --noEmit`
- **Rama de trabajo**: `claude/makicar-pricing-engine-rsTmT`
- **Deploy**: Vercel (pendiente)

Credenciales en `.env.local` (gitignored, nunca commitear):
```
NEXT_PUBLIC_SUPABASE_URL=https://wchzfowahoksisgygudz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_5g9utJNaswn-oc2-TXpR4w_Ale2iKba
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Estructura de archivos clave

```
src/
  lib/
    tarifas.ts            # Motor de precios (puro, sin efectos)
    tarifas.test.ts       # 26 tests Vitest
    conductores.ts        # getConductorActivo() — helper server-side
    supabase/
      types.ts            # Database interface tipada para Supabase
      client.ts           # createBrowserClient (componentes cliente)
      server.ts           # createServerClient con cookies (server/actions)
  middleware.ts           # Protección de rutas + refresco de sesión
  app/
    page.tsx              # Home: formulario de reserva (Server Component)
    login/
      page.tsx            # Magic link login
      actions.ts          # enviarMagicLink()
    auth/callback/
      route.ts            # Intercambia código OTP por sesión
    pago/
      page.tsx            # Resumen de reserva + opciones de pago
      PagoOpciones.tsx    # Selector tarjeta/efectivo (Client Component)
      actions.ts          # crearReserva() Server Action
    confirmacion/
      page.tsx            # Pantalla de éxito
    especial/
      page.tsx            # Formulario servicio especial (ad-hoc)
      actions.ts          # crearSolicitudEspecial() Server Action
    mis-viajes/
      page.tsx            # Lista de reservas del cliente
      actions.ts          # cancelarReserva() con lógica de penalización
  components/
    ReservaForm.tsx       # Formulario interactivo (Client Component)
    BottomTabs.tsx        # Navegación inferior (Client Component)
supabase/
  migrations/
    001_init.sql          # Schema completo, RLS, funciones helper
    002_add_fecha_hora_booking.sql  # ALTER TABLE bookings ADD COLUMN fecha_hora_solicitada
  seed.sql                # Datos de prueba
```

---

## Reglas de negocio críticas (no cambiar)

**Ruta**: Granada → Málaga → Marbella → Estepona → Algeciras (destino siempre posterior al origen)

**Precios** (ver `CLAUDE.md` para tabla completa). Marbella→Estepona = SIN SERVICIO.

**Noche**: salida entre 21:00 y 06:00 (ambas inclusive, 06:00 = noche, 06:01 = día).

**Suplementos**:
- Maleta maletero: +5 €
- Maleta asiento: +precioBase (ocupa una plaza)
- Mascota pies: +5 €
- Mascota asiento: +precioBase (ocupa una plaza)
- Ambos en asiento: +2×precioBase

**Pagos**:
- Tarjeta: pre-autorización de 15 € fijos (`capture_method: manual`), se libera siempre.
- Efectivo: sin garantía remota.

**Cancelación**:
- >24 h: gratis.
- <24 h: penalización = precio_total / 2, registrada como `deuda` (no se cobra online).

**Aprobación**: el conductor aprueba TODO. Nada se confirma automáticamente.

---

## Fase 4 — Panel del conductor (siguiente)

Según `docs/makicar-plan-desarrollo.md`, la Fase 4 incluye:

1. **Ruta protegida `/conductor`** — solo accesible si `es_conductor_activo()` devuelve true.
2. **Dashboard**: lista de reservas pendientes con botones Confirmar / Rechazar.
3. **Server Actions**: `confirmarReserva(bookingId)` y `rechazarReserva(bookingId)`.
4. **Lista de viajes**: ver trips del conductor, marcar como cerrado.
5. **Servicios especiales pendientes**: ver special_requests, proponer precio y confirmar/rechazar.
6. **Deudas**: lista de deudas pendientes por cliente.

**Restricciones de RLS relevantes**:
- `es_conductor_activo()` — función SECURITY DEFINER que comprueba si el user activo es conductor.
- `mi_conductor_id()` — devuelve el `conductor_id` del usuario activo.
- Las políticas de `bookings` ya permiten al conductor ver todas las reservas de su `conductor_id`.

---

## Workflow obligatorio

1. **Una fase a la vez**, en orden. No adelantar trabajo de fases posteriores.
2. Al terminar cada fase: **parar, resumir y esperar visto bueno** antes de continuar.
3. Antes de commitear: `npx tsc --noEmit` (0 errores) + `npx vitest run` (26 tests ✅).
4. Commits en rama `claude/makicar-pricing-engine-rsTmT`.
5. Crear PR draft tras cada push.
6. **Nunca commitear `.env.local`**.
7. **Si algo no está especificado, preguntar** — no inventar reglas de negocio.

---

## Comandos de verificación

```bash
npx tsc --noEmit       # TypeScript: debe dar 0 errores
npx vitest run         # Tests: debe dar 26 passed
npm run dev            # Servidor local en http://localhost:3000
git log --oneline -5   # Ver historial reciente
```
