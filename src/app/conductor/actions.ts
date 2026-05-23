'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function getConductorSupabase() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return supabase;
}

export async function confirmarReserva(formData: FormData) {
  const supabase = await getConductorSupabase();
  await supabase.from('bookings')
    .update({ estado: 'confirmada' })
    .eq('id', formData.get('booking_id') as string);
  revalidatePath('/conductor');
}

export async function rechazarReserva(formData: FormData) {
  const supabase = await getConductorSupabase();
  await supabase.from('bookings')
    .update({ estado: 'rechazada' })
    .eq('id', formData.get('booking_id') as string);
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
  const precio = parseFloat(formData.get('precio') as string);
  const formaPago = formData.get('forma_pago') as 'efectivo' | 'tarjeta';
  await supabase.from('special_requests').update({
    precio_propuesto: precio,
    forma_pago:       formaPago,
    estado:           'confirmada',
  }).eq('id', formData.get('sr_id') as string);
  revalidatePath('/conductor');
}

export async function rechazarEspecial(formData: FormData) {
  const supabase = await getConductorSupabase();
  await supabase.from('special_requests')
    .update({ estado: 'rechazada' })
    .eq('id', formData.get('sr_id') as string);
  revalidatePath('/conductor');
}

export async function saldaDeuda(formData: FormData) {
  const supabase = await getConductorSupabase();
  await supabase.from('deudas')
    .update({ saldada: true })
    .eq('id', formData.get('deuda_id') as string);
  revalidatePath('/conductor');
}

export async function cerrarSesionConductor() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
