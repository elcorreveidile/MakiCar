'use server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function verificarSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: ok } = await supabase.rpc('es_superadmin');
  if (!ok) redirect('/');
}

export async function crearConductor(formData: FormData) {
  await verificarSuperadmin();
  const admin   = createAdminClient();
  const nombre  = formData.get('nombre') as string;
  const email   = formData.get('email') as string;
  const tel     = (formData.get('telefono') as string)?.trim() || null;

  const { data: { user }, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error || !user) throw new Error(error?.message ?? 'Error creando usuario');

  await admin.from('profiles').insert({
    id:      user.id,
    rol:     'conductor',
    nombre,
    telefono: tel,
  });

  await admin.from('conductores').insert({
    profile_id:      user.id,
    nombre_servicio: nombre,
    email,
    plazas_vehiculo: 4,
    activo:          true,
  });

  revalidatePath('/admin');
}

export async function toggleConductor(formData: FormData) {
  await verificarSuperadmin();
  const admin       = createAdminClient();
  const conductorId = formData.get('conductor_id') as string;
  const activo      = formData.get('activo') === 'true';
  await admin.from('conductores').update({ activo: !activo }).eq('id', conductorId);
  revalidatePath('/admin');
}

export async function eliminarConductor(formData: FormData) {
  await verificarSuperadmin();
  const admin       = createAdminClient();
  const conductorId = formData.get('conductor_id') as string;

  // Verificar que no tenga viajes ni reservas vinculados
  const [{ count: nTrips }, { count: nBookings }] = await Promise.all([
    admin.from('trips').select('*', { count: 'exact', head: true }).eq('conductor_id', conductorId),
    admin.from('bookings').select('*', { count: 'exact', head: true }).eq('conductor_id', conductorId),
  ]);

  if ((nTrips ?? 0) > 0 || (nBookings ?? 0) > 0) {
    redirect('/admin?error=conductor_con_datos');
  }

  // Obtener profile_id antes de borrar
  const { data: conductor } = await admin
    .from('conductores')
    .select('profile_id')
    .eq('id', conductorId)
    .single();

  await admin.from('conductores').delete().eq('id', conductorId);

  if (conductor?.profile_id) {
    await admin.from('profiles').delete().eq('id', conductor.profile_id);
    await admin.auth.admin.deleteUser(conductor.profile_id);
  }

  revalidatePath('/admin');
}

export async function cerrarSesionAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
