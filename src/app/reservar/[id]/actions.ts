'use server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { TipoMaleta, TipoMascota, FormaPago } from '@/lib/supabase/types';

function esHoraNoche(fecha: Date): boolean {
  const m = fecha.getHours() * 60 + fecha.getMinutes();
  return m >= 21 * 60 || m <= 6 * 60;
}

export async function reservarEnViaje(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const tripId = formData.get('trip_id') as string;
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('estado', 'abierto')
    .single();

  if (!trip || trip.plazas_libres <= 0) redirect('/');

  const maleta    = ((formData.get('maleta')     as string) || 'no')       as TipoMaleta;
  const mascota   = ((formData.get('mascota')    as string) || 'no')       as TipoMascota;
  const formaPago = ((formData.get('forma_pago') as string) || 'efectivo') as FormaPago;
  const dirRecogida = (formData.get('direccion_recogida') as string)?.trim() || null;
  const dirDestino  = (formData.get('direccion_destino')  as string)?.trim() || null;

  const precioBase = trip.precio;
  let suplementos = 0;
  if (maleta  === 'maletero') suplementos += 5;
  else if (maleta  === 'asiento') suplementos += precioBase;
  if (mascota === 'pies')    suplementos += 5;
  else if (mascota === 'asiento') suplementos += precioBase;

  await supabase.from('bookings').insert({
    trip_id:              tripId,
    conductor_id:         trip.conductor_id,
    cliente_id:           user.id,
    origen:               trip.origen_cabecera,
    destino:              trip.destino_cabecera,
    fecha_hora_solicitada: trip.fecha_hora,
    direccion_recogida:   dirRecogida,
    direccion_destino:    dirDestino,
    es_noche:             esHoraNoche(new Date(trip.fecha_hora)),
    precio_base:          precioBase,
    maleta,
    mascota,
    suplementos,
    precio_total:         precioBase + suplementos,
    forma_pago:           formaPago,
  });

  // Descontar la plaza
  await supabase
    .from('trips')
    .update({ plazas_libres: trip.plazas_libres - 1 })
    .eq('id', tripId);

  // Vincular pasajero a este conductor si aún no tiene uno asignado
  const { data: perfil } = await supabase
    .from('profiles')
    .select('conductor_id')
    .eq('id', user.id)
    .single();
  if (!perfil?.conductor_id) {
    await supabase
      .from('profiles')
      .update({ conductor_id: trip.conductor_id })
      .eq('id', user.id);
  }

  redirect('/confirmacion');
}
