# MakiCar — Plan de desarrollo

> Documento de especificación para construir la PWA **MakiCar** con un agente de Claude Code.
> Transporte de pasajeros puerta a puerta de un conductor y su cartera de 20–50 clientes habituales. Complementa a BlaBlaCar, no la sustituye.
> 
> **Nota sobre escalabilidad:** en v1 hay **un solo conductor**, pero el modelo de datos se diseña desde el principio como **multi-conductor** (tabla `conductores` + `conductor_id` en viajes y reservas). La interfaz de v1 no lo muestra; el día que se añada otro conductor, la base de datos ya lo soporta sin refactorizar.

-----

## 1. Qué es MakiCar

App (web-app instalable, PWA) para gestionar las reservas del conductor y automatizar sus viajes. **Dos roles** en la misma aplicación:

- **Cliente**: consulta tramos, calcula precio, reserva plaza (troncal) o pide un servicio especial, elige forma de pago.
- **Conductor (admin)**: aprueba todas las solicitudes, ve la hoja de ruta del día, fija precio de servicios especiales, gestiona clientes.

**Importante (restricción ya validada):** NO se integra con BlaBlaCar. BlaBlaCar no ofrece API pública y automatizar su web va contra sus términos de servicio. MakiCar es un sistema independiente.

-----

## 2. Stack técnico

|Capa         |Tecnología                                                 |Notas                                                                                                                                                                      |
|-------------|-----------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|Framework    |**Next.js (App Router)** + TypeScript                      |Despliegue en Vercel                                                                                                                                                       |
|Estilos      |**Tailwind CSS**                                           |Tokens de marca en `globals.css` (ver §6)                                                                                                                                  |
|PWA          |`next-pwa` o manifest + service worker manual              |Instalable, icono en pantalla, splash                                                                                                                                      |
|Base de datos|**Supabase (PostgreSQL)**                                  |Auth + DB + Row Level Security                                                                                                                                             |
|Auth         |Supabase Auth                                              |Magic link o teléfono (clientes habituales)                                                                                                                                |
|Pagos        |**Stripe**                                                 |Pre-autorización (manual capture) de 15 €. **Cuenta del conductor**, no del operador                                                                                       |
|Avisos       |**WhatsApp Business API** (preferido) con email de respaldo|WhatsApp requiere API de WhatsApp Business + plantilla aprobada por Meta + proveedor (p.ej. Twilio). Más fricción y coste que email; valorar email en v1 y WhatsApp en v1.1|
|Hosting      |**Vercel**                                                 |PWA, sin App Store ni Google Play                                                                                                                                          |

Razón del stack: es el que Javier ya domina (Next.js + Supabase + Stripe usados en proyectos previos).

-----

## 3. Reglas de negocio (FIJAS — no inferir, ya están decididas)

### 3.1 Ruta troncal y paradas (en orden)

`Granada → Málaga → Marbella → Estepona → Algeciras`

### 3.2 Tabla de precios por tramo `[día, noche]` en euros

El precio depende del par origen→destino, NO de sumar tramos.

|Sube en |Baja en  |Día             |Noche|
|--------|---------|----------------|-----|
|Granada |Málaga   |15              |20   |
|Granada |Marbella |18              |22   |
|Granada |Estepona |20              |24   |
|Granada |Algeciras|25              |30   |
|Málaga  |Marbella |10              |15   |
|Málaga  |Estepona |13              |18   |
|Málaga  |Algeciras|15              |20   |
|Marbella|Estepona |**SIN SERVICIO**|—    |
|Marbella|Algeciras|12              |15   |
|Estepona|Algeciras|15              |18   |

- El destino debe ser **posterior** al origen en el orden de la ruta.
- `Marbella → Estepona` se bloquea aunque `Marbella → Algeciras` (que cruza Estepona) sí exista.

### 3.3 Tarifa día / noche

- **Noche** = salida entre las **21:00 y las 06:00** (ambas inclusive en el tramo nocturno).
- **Día** = resto.
- La app aplica la columna correspondiente automáticamente según la hora del viaje.

### 3.4 Suplementos

- **Equipaje de cabina**: incluido, gratis.
- **Maleta grande**: **+5 €** si cabe en maletero; **plaza completa** (= precio del tramo) si ocupa asiento. El cliente lo marca.
- **Mascota**: tres estados que marca el cliente —
  - No lleva → 0 €
  - A los pies / regazo → **+5 €**
  - Ocupa asiento → **plaza completa** (= precio del tramo)
  - **Obligatorio avisar al reservar.** Karim debe verlo en la solicitud.

### 3.5 Servicios especiales (ad hoc)

- Fuera de la ruta troncal (ej. recogida en aeropuerto, horarios especiales).
- Precio **a consultar**: lo fija Karim al aprobar la solicitud.
- Cliente envía origen, destino, día/hora, nº de pasajeros.

### 3.6 Flujo de aprobación

- **El conductor aprueba TODO** (troncal y especiales). Nada se confirma automáticamente.
- Estados de una reserva: `pendiente → confirmada / rechazada → completada / cancelada`.
- El cliente ve “pendiente de aprobación” hasta que el conductor acepte.

### 3.7 Pagos

- **Dos formas: efectivo o tarjeta** (el cliente elige).
- **Tarjeta**: al reservar se hace **pre-autorización de 15 €** (manual capture en Stripe), NO se cobra todavía. Asegura la plaza. **Se libera siempre** al confirmar o rechazar — no se captura para el viaje normal; el total se cobra aparte (en efectivo o por la pasarela del conductor).
- **Efectivo**: la reserva se crea igual pero NO queda garantizada hasta que el conductor la confirme; se paga al subir.
- El total del viaje siempre lo cobra el conductor (la pre-autorización de 15 € es solo señal). **La pasarela Stripe es del conductor**, no del operador de la app (ver §8, modelo de negocio).

### 3.8 Cancelaciones

- **Con más de 24 h de antelación**: cancelación **gratuita**. Se libera la pre-autorización (si la había) y no hay deuda.
- **Con menos de 24 h**: penalización de **media tarifa del trayecto**. Se registra como **deuda pendiente** del cliente (NO se cobra en remoto): se salda en el próximo viaje o en efectivo.
- Aplica **igual a tarjeta y a efectivo** (al ser deuda y no cobro automático, no depende de que haya tarjeta retenida).
- Implicación de datos: `bookings` necesita un campo de deuda/penalización asociado al cliente (ver §4).

### 3.9 Normas visibles antes de reservar

- 🚭 **Prohibido fumar.**
- 🐾 **Se admiten mascotas** (avisando antes).

-----

## 4. Modelo de datos (Supabase / PostgreSQL)

```
profiles
  id (uuid, = auth.users.id)
  rol            -- 'cliente' | 'conductor'
  nombre
  telefono
  direccion_habitual_recogida  -- texto libre
  created_at

conductores                   -- preparado para multi-conductor (v1: una sola fila)
  id (uuid)
  profile_id (fk -> profiles)
  nombre_servicio             -- p.ej. nombre comercial / alias
  plazas_vehiculo (int)       -- v1: 4 (4 pasajeros + conductor)
  stripe_account_id           -- la pasarela es del conductor (modelo licenciado)
  activo (bool)
  created_at

trips                         -- viajes troncales que publica un conductor
  id (uuid)
  conductor_id (fk -> conductores)
  fecha_hora (timestamptz)
  origen_cabecera             -- normalmente 'Granada'
  destino_cabecera            -- normalmente 'Algeciras'
  plazas_totales (int)
  plazas_libres (int)         -- recalculado al confirmar reservas
  estado                      -- 'abierto' | 'cerrado'
  created_at

bookings                      -- reservas de la troncal
  id (uuid)
  trip_id (fk -> trips, nullable si es especial)
  conductor_id (fk -> conductores)
  cliente_id (fk -> profiles)
  origen                      -- una de las 5 paradas
  destino                     -- una de las 5 paradas
  direccion_recogida          -- texto libre
  direccion_destino           -- texto libre
  es_noche (bool)
  precio_base (numeric)       -- calculado por el motor de tarifas
  maleta                      -- 'no' | 'maletero' | 'asiento'
  mascota                     -- 'no' | 'pies' | 'asiento'
  suplementos (numeric)
  precio_total (numeric)
  forma_pago                  -- 'efectivo' | 'tarjeta'
  stripe_payment_intent_id    -- nullable
  estado                      -- 'pendiente' | 'confirmada' | 'rechazada' | 'completada' | 'cancelada'
  cancelada_at                -- timestamptz nullable
  penalizacion (numeric)      -- media tarifa si cancela con <24h; 0 en otro caso
  created_at

deudas                        -- penalizaciones pendientes de saldar por cliente
  id (uuid)
  cliente_id (fk -> profiles)
  conductor_id (fk -> conductores)
  booking_id (fk -> bookings)
  importe (numeric)
  saldada (bool)
  created_at

special_requests              -- servicios a medida / aeropuerto
  id (uuid)
  conductor_id (fk -> conductores)
  cliente_id (fk -> profiles)
  origen_texto
  destino_texto
  fecha_hora (timestamptz)
  num_pasajeros (int)
  precio_propuesto (numeric)  -- lo fija el conductor al aprobar
  forma_pago
  stripe_payment_intent_id
  estado                      -- 'pendiente' | 'confirmada' | 'rechazada' | 'completada'
  created_at

fare_table                    -- opcional: tabla de tarifas en BD en vez de hardcode
  origen, destino, precio_dia, precio_noche
```

**Nota multi-conductor:** en v1 la tabla `conductores` tiene una sola fila y la interfaz no pide elegir conductor (se asigna el único activo por defecto). Tener `conductor_id` en `trips`, `bookings` y `special_requests` desde el principio evita una refactorización costosa si en el futuro se añaden más conductores.

**Nota tarifas:** la tabla de tarifas (§3.2) puede vivir en código (constante tipada) o en `fare_table`. Recomendación: en código para v1 (más simple), migrar a BD si se quiere editar precios sin tocar código.

-----

## 5. Pantallas a construir

### Cliente

1. **Login** — magic link / teléfono.
1. **Reservar (home)** — selector origen/destino, día-hora, maleta, mascota (3 estados), caja de precio que se recalcula en vivo, normas visibles.
1. **Pago** — elegir efectivo/tarjeta, explicación de la pre-autorización, enviar solicitud.
1. **Servicio especial** — formulario libre origen/destino/hora/pax.
1. **Confirmación** — “pendiente de aprobación”.
1. **Mis viajes** — historial y estado de cada reserva.

### Conductor

1. **Por aprobar** — bandeja de solicitudes (troncal + especiales), confirmar/rechazar, fijar precio en especiales.
1. **Hoy / hoja de ruta** — pasajeros del día, puntos de recogida, forma de pago de cada uno, caja prevista, plazas libres.
1. **Publicar viaje** — crear viaje troncal (fecha, hora, plazas).
1. **Clientes** — lista de habituales y sus datos.

> El prototipo HTML ya entregado (`makicar-prototipo-v2.html`) refleja el flujo y el diseño visual de todas estas pantallas. Úsalo como referencia de UI.

-----

## 6. Identidad visual (tokens)

```css
--noche:    #0A0E1A;   /* fondo principal */
--noche-2:  #0D1117;   /* fondo secundario */
--carta:    #141A28;   /* tarjetas */
--ambar:    #FFB627;   /* marca / acento principal */
--ruta:     #2BB6A4;   /* estados activos (en ruta, confirmado) */
--violeta:  #9b8cff;   /* etiqueta tarifa noche */
--blanco:   #F4F1EA;   /* texto */
--gris:     #8A93A6;   /* texto secundario */
--linea:    #232C3F;   /* bordes */
```

- Tipografías: **Fraunces** (titulares) + **Sora** (interfaz).
- **Logo**: isotipo = la “M” dibujada como una ruta de mapa con paradas (ver `makicar-identidad.html`). Generar versiones PNG 192/512 para el manifest de la PWA.
- Tema oscuro, sensación sobria y nocturna.

-----

## 7. Fases de trabajo (orden sugerido para Claude Code)

**Fase 0 — Andamiaje**

- Crear proyecto Next.js + TypeScript + Tailwind. Configurar tokens de marca y fuentes. Estructura de carpetas. Repo en GitHub.

**Fase 1 — Motor de tarifas (núcleo, sin UI)**

- Función pura `calcularPrecio({origen, destino, fechaHora, maleta, mascota})` que devuelve `{precioBase, esNoche, suplementos, total}` o error si el tramo no existe / orden inválido.
- Tests unitarios cubriendo: cada tramo, día vs noche (límite 21:00 y 06:00), maleta maletero/asiento, mascota pies/asiento, tramo sin servicio (Marbella→Estepona), destino anterior al origen.

**Fase 2 — Datos y auth**

- Supabase: crear tablas (§4) **incluida `conductores`**, políticas RLS (cliente solo ve lo suyo; conductor ve lo de su `conductor_id`). Auth con magic link. Seed: un conductor activo + datos de prueba.

**Fase 3 — Flujo cliente (sin pago real)**

- Pantallas 1–6. Reserva crea registro en `bookings` (con el `conductor_id` del único conductor activo) con estado `pendiente`. Servicio especial crea `special_requests`.

**Fase 4 — Panel del conductor**

- Bandeja “por aprobar”, confirmar/rechazar (actualiza estado y recalcula plazas), fijar precio en especiales, hoja de ruta del día, publicar viaje.

**Fase 5 — Stripe**

- Pre-autorización de 15 € (PaymentIntent con `capture_method: manual`) al reservar con tarjeta. **Se libera siempre** (al confirmar o rechazar); no se captura para el viaje normal.
- **La cuenta Stripe es del conductor** (modelo de herramienta licenciada): el dinero del pasaje no pasa por el operador de la app. Cada conductor conecta su propia cuenta.
- Lógica de cancelación: registrar penalización (media tarifa) como `deuda` si se cancela con menos de 24 h.

**Fase 6 — PWA + avisos**

- Manifest, service worker, iconos, instalable y offline para consulta. Aviso al cliente la víspera y hoja de ruta matinal al conductor.
- **Avisos: email en v1** (rápido de montar con Resend); **WhatsApp Business en v1.1** (preferido por el cliente, pero requiere API de WhatsApp Business + plantilla aprobada por Meta + proveedor tipo Twilio: más fricción y coste).

**Fase 7 — Pulido y despliegue**

- Estados de carga/error, validaciones, responsive, deploy en Vercel.

-----

## 8. Modelo de negocio y precio

**Modelo: herramienta licenciada (SaaS).** MakiCar es una herramienta que el operador (tu empresa) licencia a conductores. Cada conductor opera su propio negocio de transporte, cobra a sus clientes (efectivo o su propia pasarela Stripe) y paga al operador una cuota por usar la app. **El dinero de los pasajes NO pasa por el operador**, lo que evita entrar en la cadena fiscal del transporte de viajeros y no requiere Stripe Connect.

**Visión:** v1 para un conductor (piloto), arquitectura preparada para vender a varios conductores después.

**Pricing orientativo** *(órdenes de magnitud del mercado español de software a medida, NO una tasación — el precio real depende del valor del tiempo del operador y de lo que el conductor pueda asumir; consultar con gestor para la parte fiscal de facturar la licencia/cuota):*

- **Recomendado — cuota mensual:** **20–50 €/mes** por conductor (a ~60 viajes/mes le sale a céntimos por viaje, asumible como herramienta de trabajo) + posible **alta inicial de 100–300 €**. Es el modelo que escala a varios conductores y da ingreso recurrente que cubre el mantenimiento (hosting, Stripe, WhatsApp, actualizaciones).
- **Alternativa — venta perpetua:** una app a medida como esta valdría **~3.000–8.000 €** (≈10–16 jornadas a tarifas freelance españolas de 200–400 €/día). Inconveniente: el software no es “comprar y olvidar” (hosting, comisiones, WhatsApp, fallos), así que incluso vendida requiere una **cuota de mantenimiento** aparte; y cerrar la venta a uno solo no escala como producto.

> **Nota fiscal (no es asesoramiento):** cobrar una licencia/cuota es actividad económica del operador, con sus implicaciones de IVA y facturación. Confirmar estructura con un gestor.

-----

## 9. Decisiones de negocio (RESUELTAS — usar como verdad)

- **Pre-autorización**: 15 € fijos, **se libera siempre** al confirmar o rechazar. No se captura para el viaje normal.
- **Modelo**: herramienta licenciada; **los pagos llegan directamente al conductor** (su Stripe), el operador no toca el dinero del pasaje.
- **Plazas del vehículo**: **4 pasajeros** (+ conductor) → `plazas_vehiculo = 4`.
- **Cancelaciones**: gratis con +24 h; con −24 h, penalización de **media tarifa** registrada como **deuda** (no cobro remoto), igual para tarjeta y efectivo.
- **Avisos**: **email en v1**, **WhatsApp Business en v1.1**.

**Pendiente de confirmar con el conductor (no inventar):**

- Cuota concreta a aplicar (dentro del rango 20–50 €/mes) y si hay alta inicial.
- ¿El conductor tendrá su propia cuenta Stripe lista para la pre-autorización, o en el piloto se prescinde de tarjeta y solo se usa efectivo?

-----

## 10. Plazo aproximado de implementación

> **Aviso importante:** estos plazos son una **estimación orientativa** para tu escenario concreto — tú dirigiendo a un agente de Claude Code, en sesiones, con tu nivel técnico (Next.js/Supabase/Stripe ya conocidos) y revisando cada fase. No es un plazo de equipo profesional a tiempo completo. La variable que más influye no es escribir el código (el agente lo hace rápido), sino **tu tiempo de revisión y las pruebas reales**.

|Fase|Trabajo                                    |Esfuerzo estimado                       |
|----|-------------------------------------------|----------------------------------------|
|0   |Andamiaje (Next.js, Tailwind, repo, tokens)|0,5 día                                 |
|1   |Motor de tarifas + tests                   |1 día                                   |
|2   |Supabase: tablas, RLS, auth, seed          |1–2 días                                |
|3   |Flujo cliente (6 pantallas, sin pago real) |2–3 días                                |
|4   |Panel del conductor (4 pantallas)          |2–3 días                                |
|5   |Stripe (pre-autorización real)             |2–3 días *(+ espera por datos fiscales)*|
|6   |PWA + avisos automáticos                   |1–2 días                                |
|7   |Pulido, validaciones, despliegue           |1–2 días                                |

**Total estimado de trabajo efectivo: ~10–16 días de desarrollo.**

Traducido a calendario realista:

- **Si le dedicas tiempo intensivo** (varias sesiones largas por semana): un **MVP usable en 2–3 semanas** (fases 0–4, sin Stripe: ya se puede reservar y aprobar, con pago solo en efectivo).
- **Producto completo con pagos y PWA** (todas las fases): **4–6 semanas** a ritmo sostenido, contando idas y venidas, pruebas con un cliente real y el tiempo de configurar la cuenta de Stripe con datos fiscales.
- **A ritmo de ratos sueltos** (un par de tardes por semana): cuenta **2–3 meses** para el producto completo.

**Recomendación de hito:** apunta primero al **MVP sin Stripe** (fases 0–4). En cuanto un cliente pueda reservar y el conductor aprobar, ya tienes algo que probar en la vida real con pago en efectivo. Stripe (fase 5) lo añades después, cuando esté resuelto el tema del titular fiscal. Así no bloqueas todo el proyecto esperando un trámite administrativo.

-----

## 11. Archivos de referencia entregados

- `makicar-identidad.html` — guía visual (logo, paleta, tipografía, icono PWA).
- `makicar-prototipo-v2.html` — prototipo navegable de las dos caras (cliente + conductor) con el motor de precios funcionando en cliente.