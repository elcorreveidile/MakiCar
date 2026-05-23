-- Aplicar en Supabase SQL Editor antes de usar el flujo de reserva
ALTER TABLE public.bookings
ADD COLUMN fecha_hora_solicitada timestamptz;
