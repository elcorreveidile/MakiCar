-- Puntos de recogida y llegada en los viajes publicados por el conductor
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS puntos_recogida text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS puntos_llegada  text[] NOT NULL DEFAULT '{}';
