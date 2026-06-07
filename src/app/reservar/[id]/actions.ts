'use server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { calcularPrecio } from '@/lib/tarifas';
import type { Parada } from '@/lib/tarifas';
import type { TipoMaleta, TipoMascota, FormaPago } from '@/lib/supabase/types';
import { notificarNuevaReserva } from '@/lib/email';

export async function reservarEnViaje(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const tripId      = formData.get('trip_id') as string;
  const numPasajeros = Math.max(1, Math.min(4, parseInt((formData.get('num_pasajeros') as string) || '1', 10)));

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('estado', 'abierto')
    .single();

  if (!trip || trip.plazas_libres < numPasajeros) redirect('/');

  // Comprobar si el usuario ya tiene una reserva activa en este viaje
  const { data: reservaExistente } = await supabase
    .from('bookings')
    .select('id')
    .eq('trip_id', tripId)
    .eq('cliente_id', user.id)
    .in('estado', ['pendiente', 'confirmada'])
    .maybeSingle();

  if (reservaExistente) redirect(`/reservar/${tripId}?error=ya_reservado`);

  const maleta    = ((formData.get('maleta')     as string) || 'no')       as TipoMaleta;
  const mascota   = ((formData.get('mascota')    as string) || 'no')       as TipoMascota;
  const formaPago = ((formData.get('forma_pago') as string) || 'efectivo') as FormaPago;
  const dirRecogida = (formData.get('direccion_recogida') as string)?.trim() || null;
  const dirDestino  = (formData.get('direccion_destino')  as string)?.trim() || null;
  const notas       = (formData.get('notas')              as string)?.trim() || null;

  const destinoPasajero = ((formData.get('destino_pasajero') as string) || trip.destino_cabecera) as Parada;
  let precioBase: number;
  let esNoche: boolean;
  try {
    const r = calcularPrecio({
      origen:    trip.origen_cabecera as Parada,
      destino:   destinoPasajero,
      fechaHora: new Date(trip.fecha_hora),
      maleta:    'no',
      mascota:   'no',
    });
    precioBase = r.precioBase;
    esNoche    = r.esNoche;
  } catch {
    precioBase = trip.precio;
    esNoche    = false;
  }

  // precioBase es por pasajero; suplementos se aplican una vez por reserva
  let suplementos = 0;
  if (maleta  === 'maletero') suplementos += 5;
  else if (maleta  === 'asiento') suplementos += precioBase;
  if (mascota === 'pies')    suplementos += 5;
  else if (mascota === 'asiento') suplementos += precioBase;

  const precioTotal = precioBase * numPasajeros + suplementos;

  const { error: bookingError } = await supabase.from('bookings').insert({
    trip_id:              tripId,
    conductor_id:         trip.conductor_id,
    cliente_id:           user.id,
    origen:               trip.origen_cabecera,
    destino:              destinoPasajero,
    fecha_hora_solicitada: trip.fecha_hora,
    direccion_recogida:   dirRecogida,
    direccion_destino:    dirDestino,
    notas,
    num_pasajeros:        numPasajeros,
    es_noche:             esNoche,
    precio_base:          precioBase,
    maleta,
    mascota,
    suplementos,
    precio_total:         precioTotal,
    forma_pago:           formaPago,
  });

  if (bookingError) redirect(`/reservar/${tripId}?error=1`);

  // plazas_libres se recalcula automáticamente con trg_sync_plazas_libres al
  // insertar la reserva: no se descuenta aquí a mano para evitar pisar el valor
  // del trigger con una foto antigua del viaje (condición de carrera).

  // Vincular pasajero a este conductor si aún no tiene uno asignado
  const { data: perfil } = await supabase
    .from('profiles')
    .select('conductor_id, nombre')
    .eq('id', user.id)
    .single();
  if (!perfil?.conductor_id) {
    await supabase
      .from('profiles')
      .update({ conductor_id: trip.conductor_id })
      .eq('id', user.id);
  }

  await notificarNuevaReserva({
    conductorId:    trip.conductor_id,
    pasajeroNombre: perfil?.nombre ?? 'Pasajero',
    origen:         trip.origen_cabecera,
    destino:        destinoPasajero,
    fechaHora:      trip.fecha_hora,
    precioTotal,
    maleta,
    mascota,
    notas,
  });

  redirect('/confirmacion');
}
