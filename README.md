# MakiCar

PWA de reservas de transporte de pasajeros puerta a puerta para un conductor y su cartera de clientes habituales. Complementa a servicios como BlaBlaCar cubriendo horarios y frecuencias especiales, recogida y entrega a domicilio sobre la ruta **Granada — Málaga — Marbella — Estepona — Algeciras**.

## Qué hace

- **Cliente**: consulta tramos, calcula precio en vivo (día/noche, suplementos de maleta y mascota), reserva plaza en la ruta troncal o pide un servicio especial, y elige pago en efectivo o tarjeta.
- **Conductor**: aprueba todas las solicitudes, gestiona la hoja de ruta del día con puntos de recogida y caja prevista, fija precio de servicios especiales y administra su cartera de clientes.
- **Superadmin**: da de alta conductores y supervisa su actividad desde `/admin`.

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS**
- **Supabase** (PostgreSQL + Auth)
- **Stripe** (pre-autorización de plaza)
- PWA instalable, desplegada en **Vercel**

## Puesta en marcha local

### 1. Clonar el repositorio

```bash
git clone https://github.com/elcorreveidile/makicar.git
cd makicar
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Variables de entorno

Crea el archivo `.env.local` en la raíz del proyecto (nunca se sube al repo):

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://wchzfowahoksisgygudz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_5g9utJNaswn-oc2-TXpR4w_Ale2iKba
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=PEGAR_AQUI
EOF
```

`SUPABASE_SERVICE_ROLE_KEY` → Supabase Dashboard → Settings → API → **Service role key**.

### 4. Arrancar

```bash
npm run dev
```

Abre `http://localhost:3000`.

---

## Variables en Vercel (producción)

Añade en **Vercel → Settings → Environment Variables**:

| Variable | Dónde obtenerla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → Service role key |
| `NEXT_PUBLIC_SITE_URL` | Tu dominio de Vercel |

---

## Roles de usuario

| Rol | Acceso |
|---|---|
| `cliente` | Panel de pasajero (`/`) |
| `conductor` | Panel de conductor (`/conductor`) |
| `superadmin` | Panel de administración (`/admin`) |

El rol se asigna en la columna `rol` de la tabla `profiles` de Supabase.

---

## Documentación del proyecto

- `docs/makicar-plan-desarrollo.md` — especificación completa (reglas de negocio, modelo de datos, fases). **Fuente de verdad.**
- `docs/makicar-identidad.html` — guía visual (logo, paleta, tipografía).
- `docs/makicar-prototipo-v2.html` — prototipo navegable de referencia de UI.
- `CLAUDE.md` — instrucciones permanentes para el desarrollo asistido.

## Estado

En desarrollo. Ver el plan de fases en la documentación.

-----

*Marca y diseño: identidad oscura con acento ámbar de carretera. Símbolo [|].*