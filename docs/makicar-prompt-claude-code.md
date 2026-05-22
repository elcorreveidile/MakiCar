# Prompt de arranque para Claude Code — MakiCar

> Copia el bloque de abajo como **primer mensaje** al agente de Claude Code, en la carpeta vacía donde quieras crear el proyecto. Ten a mano el archivo `makicar-plan-desarrollo.md` (pásaselo o pega su contenido cuando te lo pida).

-----

```
Vamos a construir MakiCar, una PWA de reservas de transporte de pasajeros. Te voy a pasar un documento de especificación completo (makicar-plan-desarrollo.md) que es la FUENTE DE VERDAD del proyecto: contiene las reglas de negocio, el modelo de datos, el stack y las fases. Léelo entero antes de escribir nada y respétalo al pie de la letra. No inventes reglas de negocio: si algo no está en el documento o es ambiguo, PREGÚNTAME antes de asumir.

Stack obligatorio: Next.js (App Router) + TypeScript + Tailwind CSS, Supabase (PostgreSQL + Auth), Stripe para pre-autorización, despliegue pensado para Vercel como PWA. Es el stack que ya conozco, no propongas alternativas salvo que haya un motivo de peso.

Trabajamos por FASES, en el orden del documento. NO saltes de fase ni adelantes trabajo de fases posteriores. Al terminar cada fase, párate, dime qué has hecho y espera mi visto bueno antes de seguir.

Empezamos por la FASE 1: el motor de tarifas, sin interfaz.
- Implementa una función pura calcularPrecio({origen, destino, fechaHora, maleta, mascota}) que devuelva { precioBase, esNoche, suplementos, total } o un error claro si el tramo no existe o el destino no es posterior al origen.
- La tabla de precios y todas las reglas (día/noche desde las 21:00, suplementos de maleta y mascota, tramo Marbella→Estepona sin servicio) están en el documento. Úsalas EXACTAMENTE como aparecen.
- Escribe tests unitarios que cubran: cada tramo de la tabla, día vs noche en los límites (20:59, 21:00, 05:59, 06:00), maleta en maletero (+5) y maleta en asiento (= precio del tramo), mascota a los pies (+5) y mascota en asiento (= precio del tramo), el tramo sin servicio, y un destino anterior al origen.
- No montes UI todavía. Cuando los tests pasen, enséñamelos y paramos.

Antes de tocar código, hazme las preguntas que necesites sobre el documento. Cuando lo tengas claro, dime cómo vas a estructurar el proyecto (carpetas) y espera mi OK para la Fase 0 (andamiaje) y luego la Fase 1.
```

-----

## Notas para ti (no se las pases al agente, son para que lo dirijas)

- **Pásale el documento de verdad.** El prompt menciona `makicar-plan-desarrollo.md`; súbelo a la carpeta del proyecto o pega su contenido cuando el agente lo pida. Sin él, el prompt no sirve.
- **Sé tú quien marque el ritmo de fases.** El agente tenderá a correr; el prompt le pide parar en cada fase, pero refuérzalo tú si ves que se adelanta.
- **Decisión práctica del piloto:** si en el arranque el conductor aún no tiene Stripe, dile al agente que **deje la Fase 5 (Stripe) para el final** y construya el MVP solo con efectivo (reserva + aprobación + hoja de ruta). Tendrás algo usable mucho antes.
- **Cuando llegues a la Fase 2** (Supabase), tendrás que crear tú el proyecto en supabase.com y darle al agente las claves (URL y anon key) como variables de entorno. El agente te guiará, pero esa cuenta la abres tú.
- **El diseño visual ya está hecho:** pásale también `makicar-identidad.html` y `makicar-prototipo-v2.html` como referencia de UI cuando lleguéis a las fases de pantallas (3 y 4), para que respete colores, tipografías y flujo.