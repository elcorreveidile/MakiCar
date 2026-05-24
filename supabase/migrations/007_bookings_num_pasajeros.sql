-- Permite reservar varias plazas en un mismo booking
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS num_pasajeros int NOT NULL DEFAULT 1;
