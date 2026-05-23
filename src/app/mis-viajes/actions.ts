'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function cancelarReserva(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const bookingId = formData.get('booking_id') as string;

  const { data: booking } = await supabase
    .from('bookings')
    .select('precio_total, conductor_id, estado, fecha_hora_solicitada, trips(fecha_hora)')
    .eq('id', bookingId)
    .eq('cliente_id', user.id)
    .single();

  if (!booking || !['pendiente', 'confirmada'].includes(booking.estado)) return;

  // Comprobar si queda menos de 24 h para el viaje
  const tripTime =
    booking.fecha_hora_solicitada
      ? new Date(booking.fecha_hora_solicitada)
      : (booking.trips as { fecha_hora: string } | null)?.fecha_hora
        ? new Date((booking.trips as { fecha_hora: string }).fecha_hora)
        : null;

  const menosDe24h = tripTime
    ? tripTime.getTime() - Date.now() < 24 * 60 * 60 * 1000
    : false;

  const penalizacion = menosDe24h ? Math.round(booking.precio_total / 2 * 100) / 100 : 0;

  await supabase
    .from('bookings')
    .update({ estado: 'cancelada', cancelada_at: new Date().toISOString(), penalizacion })
    .eq('id', bookingId)
    .eq('cliente_id', user.id);

  if (penalizacion > 0) {
    await supabase.from('deudas').insert({
      cliente_id:   user.id,
      conductor_id: booking.conductor_id,
      booking_id:   bookingId,
      importe:      penalizacion,
    });
  }

  revalidatePath('/mis-viajes');
}

export async function cancelarEspecial(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const srId = formData.get('sr_id') as string;

  const { data: sr } = await supabase
    .from('special_requests')
    .select('estado, fecha_hora, precio_propuesto, conductor_id')
    .eq('id', srId)
    .eq('cliente_id', user.id)
    .single();

  if (!sr || !['pendiente', 'confirmada'].includes(sr.estado)) return;

  // Pendiente sin precio acordado: borrar directamente
  if (sr.estado === 'pendiente') {
    await supabase
      .from('special_requests')
      .delete()
      .eq('id', srId)
      .eq('cliente_id', user.id);
    revalidatePath('/mis-viajes');
    return;
  }

  // Confirmada con precio: marcar rechazada + penalización si <24 h
  await supabase
    .from('special_requests')
    .update({ estado: 'rechazada' })
    .eq('id', srId)
    .eq('cliente_id', user.id);

  const menosDe24h =
    new Date(sr.fecha_hora).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  if (sr.precio_propuesto && menosDe24h) {
    const penalizacion = Math.round(sr.precio_propuesto / 2 * 100) / 100;
    await supabase.from('deudas').insert({
      cliente_id:   user.id,
      conductor_id: sr.conductor_id,
      booking_id:   srId,
      importe:      penalizacion,
    });
  }

  revalidatePath('/mis-viajes');
}
