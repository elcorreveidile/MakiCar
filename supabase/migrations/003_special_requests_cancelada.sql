-- Añade estado 'cancelada' a special_requests
-- Aplicar en: Supabase Dashboard → SQL Editor

ALTER TABLE public.special_requests
  DROP CONSTRAINT special_requests_estado_check;

ALTER TABLE public.special_requests
  ADD CONSTRAINT special_requests_estado_check
  CHECK (estado IN ('pendiente','confirmada','rechazada','completada','cancelada'));
