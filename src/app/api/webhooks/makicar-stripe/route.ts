import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

// Stripe no puede leer el body procesado — necesitamos el raw text
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = process.env.MAKICAR_STRIPE_SECRET_KEY;
  const webhookSecret = process.env.MAKICAR_STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe no configurado' }, { status: 400 });
  }

  const stripe = new Stripe(secret);
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Actualiza el estado de suscripción buscando por customer ID
  async function syncStatus(customerId: string, status: string) {
    await admin.from('conductores')
      .update({ makicar_stripe_subscription_status: status })
      .eq('makicar_stripe_customer_id', customerId);
  }

  switch (event.type) {
    case 'invoice.paid': {
      const inv = event.data.object as Stripe.Invoice;
      await syncStatus(inv.customer as string, 'active');
      break;
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice;
      await syncStatus(inv.customer as string, 'past_due');
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await syncStatus(sub.customer as string, sub.status);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await admin.from('conductores')
        .update({
          makicar_stripe_subscription_status: 'canceled',
          makicar_stripe_subscription_id:     null,
        })
        .eq('makicar_stripe_customer_id', sub.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
