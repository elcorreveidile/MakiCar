-- Añadir ON DELETE CASCADE a las FKs conductor_id para que al borrar
-- un conductor PostgreSQL elimine automáticamente los registros dependientes.

ALTER TABLE trips
  DROP CONSTRAINT IF EXISTS trips_conductor_id_fkey,
  ADD CONSTRAINT trips_conductor_id_fkey
    FOREIGN KEY (conductor_id) REFERENCES conductores(id) ON DELETE CASCADE;

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_conductor_id_fkey,
  ADD CONSTRAINT bookings_conductor_id_fkey
    FOREIGN KEY (conductor_id) REFERENCES conductores(id) ON DELETE CASCADE;

ALTER TABLE special_requests
  DROP CONSTRAINT IF EXISTS special_requests_conductor_id_fkey,
  ADD CONSTRAINT special_requests_conductor_id_fkey
    FOREIGN KEY (conductor_id) REFERENCES conductores(id) ON DELETE CASCADE;
