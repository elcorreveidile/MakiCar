import Stripe from 'stripe';

// Stripe del operador (MakiCar cobra a los conductores)
// Distinto de STRIPE_SECRET_KEY que es el Stripe del conductor para cobrar a pasajeros

export function getMakicarStripe(): Stripe | null {
  const key = process.env.MAKICAR_STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export const PRICE_LAUNCH   = process.env.MAKICAR_STRIPE_PRICE_LAUNCH   ?? '';
export const PRICE_STANDARD = process.env.MAKICAR_STRIPE_PRICE_STANDARD ?? '';
