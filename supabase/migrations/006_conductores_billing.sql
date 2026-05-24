-- Facturación MakiCar → conductores (Stripe del operador)
ALTER TABLE public.conductores
  ADD COLUMN IF NOT EXISTS makicar_stripe_customer_id      text,
  ADD COLUMN IF NOT EXISTS makicar_stripe_subscription_id  text,
  ADD COLUMN IF NOT EXISTS makicar_stripe_subscription_status text NOT NULL DEFAULT 'sin_suscripcion';
