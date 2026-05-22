# MakiCar

PWA de reservas de transporte de pasajeros puerta a puerta para un conductor y su cartera de clientes habituales. Complementa a servicios como BlaBlaCar cubriendo horarios y frecuencias especiales, recogida y entrega a domicilio sobre la ruta **Granada — Málaga — Marbella — Estepona — Algeciras**.

## Qué hace

- **Cliente**: consulta tramos, calcula precio en vivo (día/noche, suplementos de maleta y mascota), reserva plaza en la ruta troncal o pide un servicio especial, y elige pago en efectivo o tarjeta.
- **Conductor**: aprueba todas las solicitudes, gestiona la hoja de ruta del día con puntos de recogida y caja prevista, fija precio de servicios especiales y administra su cartera de clientes.

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS**
- **Supabase** (PostgreSQL + Auth)
- **Stripe** (pre-autorización de plaza)
- PWA instalable, desplegada en **Vercel**

## Modelo de negocio

Herramienta licenciada (SaaS): cada conductor opera su propio negocio y cobra a sus clientes; el operador de la app cobra una cuota por su uso. El dinero del pasaje no pasa por el operador. La arquitectura está preparada para multi-conductor desde el inicio, aunque la v1 funciona con un solo conductor.

## Documentación del proyecto

- `docs/makicar-plan-desarrollo.md` — especificación completa (reglas de negocio, modelo de datos, fases). **Fuente de verdad.**
- `docs/makicar-identidad.html` — guía visual (logo, paleta, tipografía).
- `docs/makicar-prototipo-v2.html` — prototipo navegable de referencia de UI.
- `CLAUDE.md` — instrucciones permanentes para el desarrollo asistido.

## Estado

En desarrollo. Ver el plan de fases en la documentación.

-----

*Marca y diseño: identidad oscura con acento ámbar de carretera. Símbolo [|].*