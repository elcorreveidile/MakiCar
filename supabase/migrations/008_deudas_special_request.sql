-- Las deudas pueden originarse por cancelación de una reserva troncal (booking)
-- o de un servicio especial (special_request); antes solo se preveía la primera,
-- y la cancelación de especiales con penalización guardaba un id incompatible.
ALTER TABLE public.deudas
  ALTER COLUMN booking_id DROP NOT NULL,
  ADD COLUMN special_request_id uuid REFERENCES public.special_requests(id);

ALTER TABLE public.deudas
  ADD CONSTRAINT deudas_origen_unico
  CHECK ((booking_id IS NOT NULL) <> (special_request_id IS NOT NULL));

NOTIFY pgrst, 'reload schema';
