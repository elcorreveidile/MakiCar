import Stripe from 'stripe';

// Stripe del operador (MakiCar cobra a los conductores)
// Distinto de STRIPE_SECRET_KEY que es el Stripe del conductor para cobrar a pasajeros

export function getMakicarStripe(): Stripe | null {
  const key = process.env.MAKICAR_STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

// Precios desde enero de 2027: profesional (según volumen de viajes) o no profesional
export const PRICE_PRO_MENSUAL     = process.env.MAKICAR_STRIPE_PRICE_STANDARD       ?? '';
export const PRICE_PRO_ANUAL       = process.env.MAKICAR_STRIPE_PRICE_ANNUAL         ?? '';
export const PRICE_NO_PRO_MENSUAL  = process.env.MAKICAR_STRIPE_PRICE_NONPRO_MONTHLY ?? '';
export const PRICE_NO_PRO_ANUAL    = process.env.MAKICAR_STRIPE_PRICE_NONPRO_ANNUAL  ?? '';
