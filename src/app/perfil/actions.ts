'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function actualizarPerfil(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const nombre    = (formData.get('nombre')    as string).trim();
  const telefono  = (formData.get('telefono')  as string).trim() || null;
  const direccion = (formData.get('direccion') as string).trim() || null;

  await supabase.from('profiles').update({
    ...(nombre && { nombre }),
    telefono,
    direccion_habitual_recogida: direccion,
  }).eq('id', user.id);

  revalidatePath('/perfil');
  redirect('/perfil?guardado=1');
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
