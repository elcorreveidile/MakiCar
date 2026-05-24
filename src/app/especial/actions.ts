'use server';
import { createClient } from '@/lib/supabase/server';
import { getConductorActivo } from '@/lib/conductores';
import { redirect } from 'next/navigation';
import { notificarNuevaSolicitudEspecial } from '@/lib/email';

export async function crearSolicitudEspecial(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const conductor = await getConductorActivo();

  const fechaStr = formData.get('fecha') as string;
  const horaStr  = formData.get('hora')  as string;
  const fechaHora = new Date(`${fechaStr}T${horaStr}`).toISOString();

  const { error } = await supabase.from('special_requests').insert({
    conductor_id:  conductor.id,
    cliente_id:    user.id,
    origen_texto:  formData.get('origen')   as string,
    destino_texto: formData.get('destino')  as string,
    fecha_hora:    fechaHora,
    num_pasajeros: Number(formData.get('pasajeros') || 1),
    estado:        'pendiente',
  });

  if (error) throw new Error(error.message);

  const { data: perfil } = await supabase
    .from('profiles')
    .select('nombre')
    .eq('id', user.id)
    .single();

  await notificarNuevaSolicitudEspecial({
    conductorId:    conductor.id,
    pasajeroNombre: perfil?.nombre ?? 'Pasajero',
    origenTexto:    formData.get('origen')  as string,
    destinoTexto:   formData.get('destino') as string,
    fechaHora,
    numPasajeros:   Number(formData.get('pasajeros') || 1),
  });

  redirect('/confirmacion?tipo=especial');
}
