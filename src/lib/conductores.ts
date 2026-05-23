import { createClient } from '@/lib/supabase/server';

export async function getConductorActivo() {
  const supabase = await createClient();

  const query = supabase
    .from('conductores')
    .select('id, nombre_servicio, plazas_vehiculo');

  // En producción cada despliegue tiene su CONDUCTOR_ID propio.
  // En desarrollo sin esa variable se usa el único conductor activo.
  const { data, error } = process.env.CONDUCTOR_ID
    ? await query.eq('id', process.env.CONDUCTOR_ID).single()
    : await query.eq('activo', true).single();

  if (error || !data) throw new Error('No hay conductor activo configurado');
  return data;
}
