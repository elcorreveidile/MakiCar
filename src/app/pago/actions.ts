'use server';
import { createClient } from '@/lib/supabase/server';
import { getConductorActivo } from '@/lib/conductores';
import { calcularPrecio } from '@/lib/tarifas';
import { redirect } from 'next/navigation';
import type { Parada, Maleta, Mascota } from '@/lib/tarifas';
import type { FormaPago } from '@/lib/supabase/types';

export async function crearReserva(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const origen   = formData.get('origen')   as Parada;
  const destino  = formData.get('destino')  as Parada;
  const fecha    = formData.get('fecha')    as string;
  const maleta   = formData.get('maleta')   as Maleta;
  const mascota  = formData.get('mascota')  as Mascota;
  const formaPago = formData.get('forma_pago') as FormaPago;
  const dirRecogida = (formData.get('dir_recogida') as string) || null;
  const dirDestino  = (formData.get('dir_destino')  as string) || null;

  // Recalcular precio server-side (no se confía en el cliente)
  const fechaHora = new Date(fecha);
  const precio = calcularPrecio({ origen, destino, fechaHora, maleta, mascota });
  const conductor = await getConductorActivo();

  const { error } = await supabase.from('bookings').insert({
    conductor_id:           conductor.id,
    cliente_id:             user.id,
    origen,
    destino,
    fecha_hora_solicitada:  fechaHora.toISOString(),
    direccion_recogida:     dirRecogida,
    direccion_destino:      dirDestino,
    es_noche:               precio.esNoche,
    precio_base:            precio.precioBase,
    maleta,
    mascota,
    suplementos:            precio.suplementos,
    precio_total:           precio.total,
    forma_pago:             formaPago,
    estado:                 'pendiente',
  });

  if (error) throw new Error(error.message);
  redirect('/confirmacion');
}
