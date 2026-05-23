'use server';
import { createClient } from '@/lib/supabase/server';
import { getConductorActivo } from '@/lib/conductores';
import { redirect } from 'next/navigation';

export async function crearSolicitudEspecial(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const conductor = await getConductorActivo();

  const { error } = await supabase.from('special_requests').insert({
    conductor_id:  conductor.id,
    cliente_id:    user.id,
    origen_texto:  formData.get('origen')   as string,
    destino_texto: formData.get('destino')  as string,
    fecha_hora:    new Date(formData.get('fecha') as string).toISOString(),
    num_pasajeros: Number(formData.get('pasajeros') || 1),
    estado:        'pendiente',
  });

  if (error) throw new Error(error.message);
  redirect('/confirmacion?tipo=especial');
}
