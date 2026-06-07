'use server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { notificarAltaConductor, notificarBajaConductor, notificarBajaConductorEspecial } from '@/lib/email';
import { getMakicarStripe, PRICE_PRO_MENSUAL, PRICE_PRO_ANUAL, PRICE_NO_PRO_MENSUAL, PRICE_NO_PRO_ANUAL } from '@/lib/stripe/makicar';

// La app es gratuita para los conductores durante todo 2026 (sin alta, sin cuota):
// no se les da de alta en Stripe ni se les factura hasta enero de 2027.
const INICIO_FACTURACION = new Date('2027-01-01T00:00:00Z');

async function verificarSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: ok } = await supabase.rpc('es_superadmin');
  if (!ok) redirect('/');
}

export async function crearConductor(formData: FormData) {
  await verificarSuperadmin();
  const admin  = createAdminClient();
  const nombre = formData.get('nombre') as string;
  const email  = formData.get('email') as string;
  const tel    = (formData.get('telefono') as string)?.trim() || null;

  // Categoría de facturación (vigente desde enero de 2027): la decide el superadmin
  // según el volumen de viajes que gestione el conductor
  const esProfesional    = formData.get('es_profesional') === 'on';
  const facturacionAnual = formData.get('facturacion') === 'anual';

  // Intentar crear el usuario en Auth
  const { data: { user: newUser }, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  let userId: string;

  if (error) {
    // Si ya existe en Auth (borrado de conductor previo dejó huérfano),
    // buscamos el usuario existente y lo reutilizamos.
    if (!error.message.toLowerCase().includes('already')) {
      throw new Error(error.message);
    }
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const found = users.find(u => u.email === email);
    if (!found) throw new Error('No se pudo crear ni localizar el usuario en Auth');
    userId = found.id;
  } else {
    if (!newUser) throw new Error('Error creando usuario');
    userId = newUser.id;
  }

  // Upsert del perfil (el trigger puede haberlo creado ya, o puede ser uno existente)
  const { error: profileError } = await admin.from('profiles').upsert({
    id:       userId,
    rol:      'conductor',
    nombre,
    telefono: tel,
  }, { onConflict: 'id' });
  if (profileError) throw new Error(`Error actualizando perfil: ${profileError.message}`);

  // Insertar o reactivar en conductores
  const { data: conductorExistente } = await admin
    .from('conductores').select('id').eq('profile_id', userId).maybeSingle();

  if (conductorExistente) {
    const { error: updateError } = await admin.from('conductores').update({
      nombre_servicio:    nombre,
      email,
      activo:             true,
      es_profesional:     esProfesional,
      facturacion_anual:  facturacionAnual,
    }).eq('profile_id', userId);
    if (updateError) throw new Error(`Error actualizando conductor: ${updateError.message}`);
  } else {
    const { error: insertError } = await admin.from('conductores').insert({
      profile_id:         userId,
      nombre_servicio:    nombre,
      email,
      plazas_vehiculo:    4,
      activo:             true,
      es_profesional:     esProfesional,
      facturacion_anual:  facturacionAnual,
    });
    if (insertError) throw new Error(`Error insertando conductor: ${insertError.message}`);
  }

  // Avisar al conductor de cómo entrar en su panel (no hay invitación automática de Supabase)
  await notificarAltaConductor({ email, nombre });

  // ── Facturación Stripe del operador ────────────────────
  // (desactivada durante 2026: la app es gratuita hasta enero de 2027)
  const stripe = getMakicarStripe();
  if (stripe && Date.now() >= INICIO_FACTURACION.getTime()) {
    try {
      const priceId = esProfesional
        ? (facturacionAnual ? PRICE_PRO_ANUAL    : PRICE_PRO_MENSUAL)
        : (facturacionAnual ? PRICE_NO_PRO_ANUAL : PRICE_NO_PRO_MENSUAL);

      if (priceId) {
        const customer = await stripe.customers.create({
          email,
          name:               nombre,
          preferred_locales:  ['es'],
          metadata:           { makicar_profile_id: userId },
        });

        const subscription = await stripe.subscriptions.create({
          customer:          customer.id,
          items:             [{ price: priceId }],
          collection_method: 'send_invoice',
          days_until_due:    30,
          metadata:          { makicar_profile_id: userId },
        });

        // Finalizar y enviar la primera factura inmediatamente
        const sub = await stripe.subscriptions.retrieve(subscription.id, {
          expand: ['latest_invoice'],
        });
        const latestInvoice = sub.latest_invoice as import('stripe').Stripe.Invoice | null;
        if (latestInvoice?.id && latestInvoice.status === 'draft') {
          await stripe.invoices.finalizeInvoice(latestInvoice.id);
        }

        await admin.from('conductores').update({
          makicar_stripe_customer_id:         customer.id,
          makicar_stripe_subscription_id:     subscription.id,
          makicar_stripe_subscription_status: subscription.status,
        }).eq('profile_id', userId);
      }
    } catch (err) {
      // No bloqueamos la creación del conductor si Stripe falla
      console.error('[MakiCar Stripe] Error creando suscripción:', err);
    }
  }

  revalidatePath('/admin');
}

export async function toggleConductor(formData: FormData) {
  await verificarSuperadmin();
  const admin       = createAdminClient();
  const conductorId = formData.get('conductor_id') as string;
  const activo      = formData.get('activo') === 'true';

  await admin.from('conductores').update({ activo: !activo }).eq('id', conductorId);

  // Al desactivar: cancelar viajes abiertos, reservas activas y especiales pendientes
  if (activo) {
    // 1. Obtener viajes abiertos
    const { data: trips } = await admin
      .from('trips')
      .select('id')
      .eq('conductor_id', conductorId)
      .eq('estado', 'abierto');

    const tripIds = (trips ?? []).map(t => t.id);

    if (tripIds.length > 0) {
      // 2. Obtener reservas activas de esos viajes
      const { data: bookings } = await admin
        .from('bookings')
        .select('id, cliente_id, origen, destino, fecha_hora_solicitada')
        .in('trip_id', tripIds)
        .in('estado', ['pendiente', 'confirmada']);

      // 3. Cancelar reservas (sin penalización) y notificar pasajeros
      if (bookings && bookings.length > 0) {
        await admin
          .from('bookings')
          .update({ estado: 'cancelada', penalizacion: 0, cancelada_at: new Date().toISOString() })
          .in('id', bookings.map(b => b.id));

        for (const b of bookings) {
          await notificarBajaConductor({
            pasajeroId: b.cliente_id,
            origen:     b.origen,
            destino:    b.destino,
            fechaHora:  b.fecha_hora_solicitada ?? '',
          });
        }
      }

      // 4. Cerrar los viajes
      await admin
        .from('trips')
        .update({ estado: 'cerrado' })
        .in('id', tripIds);
    }

    // 5. Cancelar servicios especiales activos
    const { data: especiales } = await admin
      .from('special_requests')
      .select('id, cliente_id, origen_texto, destino_texto, fecha_hora')
      .eq('conductor_id', conductorId)
      .in('estado', ['pendiente', 'confirmada']);

    if (especiales && especiales.length > 0) {
      await admin
        .from('special_requests')
        .update({ estado: 'cancelada' })
        .in('id', especiales.map(s => s.id));

      for (const s of especiales) {
        await notificarBajaConductorEspecial({
          pasajeroId:   s.cliente_id,
          origenTexto:  s.origen_texto,
          destinoTexto: s.destino_texto,
          fechaHora:    s.fecha_hora,
        });
      }
    }
  }

  revalidatePath('/admin');
}

export async function eliminarConductor(formData: FormData) {
  await verificarSuperadmin();
  const admin       = createAdminClient();
  const conductorId = formData.get('conductor_id') as string;

  // Cancelar viajes abiertos, reservas activas y especiales pendientes antes de borrar
  const { data: trips } = await admin
    .from('trips')
    .select('id')
    .eq('conductor_id', conductorId)
    .eq('estado', 'abierto');

  const tripIds = (trips ?? []).map(t => t.id);

  if (tripIds.length > 0) {
    const { data: bookings } = await admin
      .from('bookings')
      .select('id, cliente_id, origen, destino, fecha_hora_solicitada')
      .in('trip_id', tripIds)
      .in('estado', ['pendiente', 'confirmada']);

    if (bookings && bookings.length > 0) {
      await admin
        .from('bookings')
        .update({ estado: 'cancelada', penalizacion: 0, cancelada_at: new Date().toISOString() })
        .in('id', bookings.map(b => b.id));

      for (const b of bookings) {
        await notificarBajaConductor({
          pasajeroId: b.cliente_id,
          origen:     b.origen,
          destino:    b.destino,
          fechaHora:  b.fecha_hora_solicitada ?? '',
        });
      }
    }

    await admin.from('trips').update({ estado: 'cerrado' }).in('id', tripIds);
  }

  const { data: especiales } = await admin
    .from('special_requests')
    .select('id, cliente_id, origen_texto, destino_texto, fecha_hora')
    .eq('conductor_id', conductorId)
    .in('estado', ['pendiente', 'confirmada']);

  if (especiales && especiales.length > 0) {
    await admin
      .from('special_requests')
      .update({ estado: 'cancelada' })
      .in('id', especiales.map(s => s.id));

    for (const s of especiales) {
      await notificarBajaConductorEspecial({
        pasajeroId:   s.cliente_id,
        origenTexto:  s.origen_texto,
        destinoTexto: s.destino_texto,
        fechaHora:    s.fecha_hora,
      });
    }
  }

  // Obtener datos antes de borrar (profile_id + Stripe IDs)
  const { data: conductor } = await admin
    .from('conductores')
    .select('profile_id, makicar_stripe_customer_id, makicar_stripe_subscription_id')
    .eq('id', conductorId)
    .single();

  // Cancelar suscripción Stripe del operador si existe
  const stripe = getMakicarStripe();
  if (stripe && conductor?.makicar_stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(conductor.makicar_stripe_subscription_id);
    } catch (err) {
      console.error('[MakiCar Stripe] Error cancelando suscripción:', err);
    }
  }

  // Eliminar filas que referencian al conductor (FKs sin CASCADE)
  await admin.from('bookings').delete().eq('conductor_id', conductorId);
  await admin.from('trips').delete().eq('conductor_id', conductorId);
  await admin.from('special_requests').delete().eq('conductor_id', conductorId);

  await admin.from('conductores').delete().eq('id', conductorId);

  if (conductor?.profile_id) {
    await admin.from('profiles').delete().eq('id', conductor.profile_id);
    await admin.auth.admin.deleteUser(conductor.profile_id);
  }

  redirect('/admin');
}

export async function cerrarSesionAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
