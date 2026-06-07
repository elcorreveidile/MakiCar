-- Categoría de facturación MakiCar → conductores (vigente desde enero 2027)
-- es_profesional: lo decide el superadmin según el volumen de viajes que gestione el conductor
-- facturacion_anual: ciclo de cobro elegido al dar de alta al conductor
ALTER TABLE public.conductores
  ADD COLUMN IF NOT EXISTS es_profesional     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS facturacion_anual  boolean NOT NULL DEFAULT false;
