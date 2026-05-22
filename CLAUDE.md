# CLAUDE.md — Instrucciones de desarrollo de MakiCar

Este archivo guía a Claude Code en el desarrollo de MakiCar. Léelo al inicio de cada sesión.

## Fuente de verdad

El documento `docs/makicar-plan-desarrollo.md` es la **especificación completa y la fuente de verdad** del proyecto. Las reglas de abajo son un resumen para tenerlas a mano; ante cualquier duda o conflicto, manda el documento. **Si algo no está especificado o es ambiguo, PREGUNTA antes de asumir. No inventes reglas de negocio.**

## Cómo trabajar

- **Por fases, en orden** (ver el plan). No adelantes trabajo de fases posteriores.
- **Al terminar cada fase, párate**, resume lo hecho y espera el visto bueno antes de continuar.
- **No corras.** Es preferible una fase bien probada que tres a medias.
- Haz **commits pequeños y descriptivos** al cerrar cada paso.
- Para el motor de tarifas y cualquier lógica de negocio: **tests primero o en paralelo**, nunca sin tests.

## Stack (no cambiar sin motivo de peso)

Next.js (App Router) + TypeScript · Tailwind CSS · Supabase (PostgreSQL + Auth) · Stripe (pre-autorización) · PWA · despliegue en Vercel.

## Reglas de negocio (FIJAS — usar exactamente)

### Ruta troncal (en orden)

`Granada → Málaga → Marbella → Estepona → Algeciras`
El destino debe ser **posterior** al origen en este orden.

### Tabla de precios por tramo [día, noche] en euros

|Origen → Destino    |Día             |Noche|
|--------------------|----------------|-----|
|Granada → Málaga    |15              |20   |
|Granada → Marbella  |18              |22   |
|Granada → Estepona  |20              |24   |
|Granada → Algeciras |25              |30   |
|Málaga → Marbella   |10              |15   |
|Málaga → Estepona   |13              |18   |
|Málaga → Algeciras  |15              |20   |
|Marbella → Estepona |**SIN SERVICIO**|—    |
|Marbella → Algeciras|12              |15   |
|Estepona → Algeciras|15              |18   |

El precio es del par origen→destino, **no se suman tramos**. `Marbella → Estepona` se bloquea aunque `Marbella → Algeciras` (que la cruza) sí exista.

### Tarifa día / noche

- **Noche**: salida entre las **21:00 y las 06:00**.
- **Día**: el resto.
- La app aplica la columna automáticamente según la hora del viaje.

### Suplementos

- Equipaje de cabina: incluido, gratis.
- **Maleta grande**: `+5 €` si va en maletero; **precio completo del tramo** si ocupa asiento. Lo marca el cliente.
- **Mascota** (tres estados, lo marca el cliente; obligatorio avisar):
  - No → 0 €
  - A los pies / regazo → `+5 €`
  - Ocupa asiento → **precio completo del tramo**

### Servicios especiales (ad hoc)

Fuera de la ruta troncal (aeropuerto, horarios especiales). Precio **a consultar**: lo fija el conductor al aprobar. El cliente envía origen, destino, día/hora y nº de pasajeros.

### Aprobación

**El conductor aprueba TODO** (troncal y especiales). Nada se confirma automáticamente. Estados de reserva: `pendiente → confirmada / rechazada → completada / cancelada`.

### Pagos

- Efectivo o tarjeta (elige el cliente).
- **Tarjeta**: pre-autorización de **15 € fijos** (`capture_method: manual`) al reservar. **Se libera siempre** (al confirmar o rechazar); no se captura para el viaje normal. Asegura la plaza.
- **Efectivo**: la reserva se crea pero no queda garantizada hasta que el conductor la confirme.
- **La pasarela Stripe es del conductor**, no del operador de la app. El dinero del pasaje no pasa por el operador.

### Cancelaciones

- **Más de 24 h** de antelación: gratis, sin penalización.
- **Menos de 24 h**: penalización de **media tarifa del trayecto**, registrada como **deuda** del cliente (no se cobra en remoto; se salda en el próximo viaje o en efectivo). Aplica igual a tarjeta y efectivo.

### Vehículo

**4 plazas** de pasajero (+ conductor). `plazas_vehiculo = 4`.

### Normas visibles antes de reservar

🚭 Prohibido fumar · 🐾 Se admiten mascotas (avisando antes).

### Multi-conductor

v1 = un solo conductor, pero el modelo de datos lleva tabla `conductores` y `conductor_id` en viajes, reservas y servicios especiales desde el principio. La interfaz de v1 no pide elegir conductor (asigna el único activo).

## Avisos

Email en v1 (Resend). WhatsApp Business en v1.1 (requiere API de WhatsApp Business + plantilla aprobada por Meta + proveedor tipo Twilio).

## Identidad visual (tokens)

```
--noche:#0A0E1A  --noche-2:#0D1117  --carta:#141A28
--ambar:#FFB627  --ruta:#2BB6A4  --violeta:#9b8cff
--blanco:#F4F1EA  --gris:#8A93A6  --linea:#232C3F
```

Tipografías: **Fraunces** (titulares) + **Sora** (interfaz). Tema oscuro. Logo: la “M” como ruta de mapa con paradas (ver `docs/makicar-identidad.html`). Referencia de UI: `docs/makicar-prototipo-v2.html`.

## Pendiente de confirmar con el usuario (no inventar)

- Cuota de licencia a aplicar al conductor (rango orientativo 20–50 €/mes).
- Si el conductor tendrá Stripe listo en el piloto o se arranca solo con efectivo (en cuyo caso la fase de Stripe se pospone y el MVP va sin tarjeta).