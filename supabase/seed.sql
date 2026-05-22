-- ============================================================
-- MakiCar — Seed de desarrollo
-- ============================================================
-- Pasos previos (solo una vez):
--
-- 1. Ve a Supabase Dashboard → Authentication → Users → "Add user"
--    Crea el usuario conductor:
--      Email:    conductor@makicar.test   (o tu email real)
--      Password: cualquiera (usaremos magic link, no contraseña)
--      ✓ Auto Confirm User
--    Anota el UUID que aparece en la columna "UID".
--
-- 2. Crea 2 clientes de prueba del mismo modo:
--      cliente1@makicar.test
--      cliente2@makicar.test
--
-- 3. Sustituye los tres UUIDs de abajo y ejecuta este script
--    en: SQL Editor → New query → Run
-- ============================================================

DO $$
DECLARE
  v_conductor_uuid  uuid := 'PEGA-AQUI-UUID-DEL-CONDUCTOR';
  v_cliente1_uuid   uuid := 'PEGA-AQUI-UUID-DEL-CLIENTE-1';
  v_cliente2_uuid   uuid := 'PEGA-AQUI-UUID-DEL-CLIENTE-2';
  v_conductor_id    uuid;
  v_trip_id         uuid;
BEGIN

  -- ── Perfiles ──────────────────────────────────────────────
  -- (el trigger on_auth_user_created ya creó las filas con rol='cliente')

  -- Ascender al conductor
  UPDATE public.profiles
  SET rol = 'conductor', nombre = 'Karim'
  WHERE id = v_conductor_uuid;

  UPDATE public.profiles SET nombre = 'Ana García'   WHERE id = v_cliente1_uuid;
  UPDATE public.profiles SET nombre = 'Carlos López' WHERE id = v_cliente2_uuid;

  -- ── Conductor ─────────────────────────────────────────────
  INSERT INTO public.conductores (profile_id, nombre_servicio, plazas_vehiculo, activo)
  VALUES (v_conductor_uuid, 'MakiCar', 4, true)
  RETURNING id INTO v_conductor_id;

  -- ── Viaje de prueba: mañana a las 08:00 ──────────────────
  INSERT INTO public.trips (
    conductor_id, fecha_hora,
    origen_cabecera, destino_cabecera,
    plazas_totales, plazas_libres, estado
  )
  VALUES (
    v_conductor_id,
    date_trunc('day', now()) + interval '1 day' + interval '8 hours',
    'Granada', 'Algeciras',
    4, 3, 'abierto'
  )
  RETURNING id INTO v_trip_id;

  -- ── Reserva de prueba (pendiente) ────────────────────────
  INSERT INTO public.bookings (
    trip_id, conductor_id, cliente_id,
    origen, destino,
    direccion_recogida, direccion_destino,
    es_noche, precio_base, maleta, mascota,
    suplementos, precio_total,
    forma_pago, estado
  )
  VALUES (
    v_trip_id, v_conductor_id, v_cliente1_uuid,
    'Granada', 'Málaga',
    'Calle Gran Vía 1, Granada', 'Av. Andalucía 5, Málaga',
    false, 15, 'maletero', 'no',
    5, 20,
    'efectivo', 'pendiente'
  );

END $$;
