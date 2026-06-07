'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  notificarReservaConfirmada,
  notificarReservaRechazada,
  notificarEspecialConfirmada,
  notificarEspecialRechazada,
} from '@/lib/email';

async function getConductorSupabase() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return supabase;
}

export async function confirmarReserva(formData: FormData) {
  const supabase = await getConductorSupabase();
  const bookingId = formData.get('booking_id') as string;

  const { data: booking } = await supabase
    .from('bookings')
    .select('cliente_id, origen, destino, fecha_hora_solicitada, precio_total, forma_pago')
    .eq('id', bookingId)
    .single();

  await supabase.from('bookings')
    .update({ estado: 'confirmada' })
    .eq('id', bookingId);

  if (booking) {
    await notificarReservaConfirmada({
      pasajeroId: booking.cliente_id,
      origen:     booking.origen,
      destino:    booking.destino,
      fechaHora:  booking.fecha_hora_solicitada ?? '',
      precioTotal: booking.precio_total,
      formaPago:  booking.forma_pago,
    });
  }

  revalidatePath('/conductor');
}

export async function rechazarReserva(formData: FormData) {
  const supabase = await getConductorSupabase();
  const bookingId = formData.get('booking_id') as string;

  const { data: booking } = await supabase
    .from('bookings')
    .select('cliente_id, origen, destino, fecha_hora_solicitada')
    .eq('id', bookingId)
    .single();

  await supabase.from('bookings')
    .update({ estado: 'rechazada' })
    .eq('id', bookingId);

  // plazas_libres se recalcula automáticamente con trg_sync_plazas_libres al
  // cambiar el estado de la reserva: no se toca aquí a mano para no duplicar el ajuste.

  if (booking) {
    await notificarReservaRechazada({
      pasajeroId: booking.cliente_id,
      origen:     booking.origen,
      destino:    booking.destino,
      fechaHora:  booking.fecha_hora_solicitada ?? '',
    });
  }

  revalidatePath('/conductor');
}

export async function completarReserva(formData: FormData) {
  const supabase = await getConductorSupabase();
  await supabase.from('bookings')
    .update({ estado: 'completada' })
    .eq('id', formData.get('booking_id') as string);
  revalidatePath('/conductor');
}

export async function confirmarEspecial(formData: FormData) {
  const supabase = await getConductorSupabase();
  const srId    = formData.get('sr_id') as string;
  const precio  = parseFloat(formData.get('precio') as string);
  const formaPago = formData.get('forma_pago') as 'efectivo' | 'tarjeta';

  const { data: sr } = await supabase
    .from('special_requests')
    .select('cliente_id, origen_texto, destino_texto, fecha_hora')
    .eq('id', srId)
    .single();

  await supabase.from('special_requests').update({
    precio_propuesto: precio,
    forma_pago:       formaPago,
    estado:           'confirmada',
  }).eq('id', srId);

  if (sr) {
    await notificarEspecialConfirmada({
      pasajeroId:     sr.cliente_id,
      origenTexto:    sr.origen_texto,
      destinoTexto:   sr.destino_texto,
      fechaHora:      sr.fecha_hora,
      precioPropuesto: precio,
      formaPago,
    });
  }

  revalidatePath('/conductor');
}

export async function rechazarEspecial(formData: FormData) {
  const supabase = await getConductorSupabase();
  const srId = formData.get('sr_id') as string;

  const { data: sr } = await supabase
    .from('special_requests')
    .select('cliente_id, origen_texto, destino_texto')
    .eq('id', srId)
    .single();

  await supabase.from('special_requests')
    .update({ estado: 'rechazada' })
    .eq('id', srId);

  if (sr) {
    await notificarEspecialRechazada({
      pasajeroId:   sr.cliente_id,
      origenTexto:  sr.origen_texto,
      destinoTexto: sr.destino_texto,
    });
  }

  revalidatePath('/conductor');
}

export async function saldaDeuda(formData: FormData) {
  const supabase = await getConductorSupabase();
  await supabase.from('deudas')
    .update({ saldada: true })
    .eq('id', formData.get('deuda_id') as string);
  revalidatePath('/conductor');
}

export async function crearViaje(formData: FormData) {
  const supabase = await getConductorSupabase();
  const { data: conductorId } = await supabase.rpc('mi_conductor_id');
  if (!conductorId) return;

  const plazas = parseInt(formData.get('plazas') as string, 10);
  const precio = parseFloat(formData.get('precio') as string);
  const fecha  = formData.get('fecha') as string;
  const hora   = formData.get('hora') as string;
  const fechaHora = `${fecha}T${hora}`;
  const puntosRecogida = formData.getAll('puntos_recogida').map(String).filter(Boolean);
  const puntosLlegada  = formData.getAll('puntos_llegada').map(String).filter(Boolean);

  await supabase.from('trips').insert({
    conductor_id:      conductorId,
    origen_cabecera:   formData.get('origen') as string,
    destino_cabecera:  formData.get('destino') as string,
    fecha_hora:        fechaHora,
    plazas_totales:    plazas,
    plazas_libres:     plazas,
    precio,
    puntos_recogida:   puntosRecogida,
    puntos_llegada:    puntosLlegada,
  });
  revalidatePath('/conductor');
}

export async function editarViaje(formData: FormData) {
  const supabase = await getConductorSupabase();
  const tripId     = formData.get('trip_id') as string;
  const nuevasPlazas = parseInt(formData.get('plazas') as string, 10);
  const precio       = parseFloat(formData.get('precio') as string);
  const fecha        = formData.get('fecha') as string;
  const hora         = formData.get('hora') as string;
  const fechaHora    = `${fecha}T${hora}`;

  const { data: trip } = await supabase
    .from('trips').select('plazas_totales, plazas_libres').eq('id', tripId).single();
  if (!trip) return;

  const delta       = nuevasPlazas - trip.plazas_totales;
  const nuevasLibres = Math.max(0, trip.plazas_libres + delta);

  const puntosRecogida = formData.getAll('puntos_recogida').map(String).filter(Boolean);
  const puntosLlegada  = formData.getAll('puntos_llegada').map(String).filter(Boolean);

  const { error } = await supabase.from('trips').update({
    fecha_hora:      fechaHora,
    plazas_totales:  nuevasPlazas,
    plazas_libres:   nuevasLibres,
    precio,
    puntos_recogida: puntosRecogida,
    puntos_llegada:  puntosLlegada,
  }).eq('id', tripId);
  if (error) throw new Error(error.message);
  revalidatePath('/conductor');
  redirect('/conductor');
}

export async function cerrarViaje(formData: FormData) {
  const supabase = await getConductorSupabase();
  await supabase.from('trips')
    .update({ estado: 'cerrado' })
    .eq('id', formData.get('trip_id') as string);
  revalidatePath('/conductor');
}

export async function reabrirViaje(formData: FormData) {
  const supabase = await getConductorSupabase();
  await supabase.from('trips')
    .update({ estado: 'abierto' })
    .eq('id', formData.get('trip_id') as string);
  revalidatePath('/conductor');
}

export async function eliminarViaje(formData: FormData) {
  const supabase = await getConductorSupabase();
  const tripId = formData.get('trip_id') as string;

  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .in('estado', ['pendiente', 'confirmada']);

  if ((count ?? 0) > 0) {
    redirect('/conductor?error=reservas_activas');
  }

  await supabase.from('trips').delete().eq('id', tripId);
  revalidatePath('/conductor');
}

export async function eliminarReservaCancelada(formData: FormData) {
  const supabase = await getConductorSupabase();
  const bookingId = formData.get('booking_id') as string;
  // Borra la deuda y pone penalizacion=0 para que no aparezca en la sección,
  // pero conserva el booking para mantener el historial del pasajero.
  await supabase.from('deudas').delete().eq('booking_id', bookingId);
  await supabase.from('bookings')
    .update({ penalizacion: 0 })
    .eq('id', bookingId)
    .eq('estado', 'cancelada');
  revalidatePath('/conductor');
}

export async function cerrarSesionConductor() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
