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
  const avatar    = formData.get('avatar') as File | null;

  let avatar_url: string | undefined;

  if (avatar && avatar.size > 0) {
    const ext = avatar.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, avatar, { upsert: true, contentType: avatar.type });

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);
      avatar_url = `${publicUrl}?t=${Date.now()}`;
    }
  }

  await supabase.from('profiles').update({
    ...(nombre && { nombre }),
    telefono,
    direccion_habitual_recogida: direccion,
    ...(avatar_url && { avatar_url }),
  }).eq('id', user.id);

  revalidatePath('/perfil');
  redirect('/perfil?guardado=1');
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
