import { createClient } from '@/lib/supabase/server';

export async function getConductorActivo() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conductores')
    .select('id, nombre_servicio, plazas_vehiculo')
    .eq('activo', true)
    .single();

  if (error || !data) throw new Error('No hay conductor activo configurado');
  return data;
}
