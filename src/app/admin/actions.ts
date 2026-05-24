'use server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { notificarBajaConductor, notificarBajaConductorEspecial } from '@/lib/email';

async function verificarSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: ok } = await supabase.rpc('es_superadmin');
  if (!ok) redirect('/');
}

export async function crearConductor(formData: FormData) {
  await verificarSuperadmin();
  const admin  = createAdminClient();
  const nombre = formData.get('nombre') as string;
  const email  = formData.get('email') as string;
  const tel    = (formData.get('telefono') as string)?.trim() || null;

  // Intentar crear el usuario en Auth
  const { data: { user: newUser }, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  let userId: string;

  if (error) {
    // Si ya existe en Auth (borrado de conductor previo dejó huérfano),
    // buscamos el usuario existente y lo reutilizamos.
    if (!error.message.toLowerCase().includes('already')) {
      throw new Error(error.message);
    }
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const found = users.find(u => u.email === email);
    if (!found) throw new Error('No se pudo crear ni localizar el usuario en Auth');
    userId = found.id;
  } else {
    if (!newUser) throw new Error('Error creando usuario');
    userId = newUser.id;
  }

  // Upsert del perfil (el trigger puede haberlo creado ya, o puede ser uno existente)
  const { error: profileError } = await admin.from('profiles').upsert({
    id:       userId,
    rol:      'conductor',
    nombre,
    telefono: tel,
  }, { onConflict: 'id' });
  if (profileError) throw new Error(`Error actualizando perfil: ${profileError.message}`);

  // Insertar o reactivar en conductores
  const { data: conductorExistente } = await admin
    .from('conductores').select('id').eq('profile_id', userId).maybeSingle();

  if (conductorExistente) {
    const { error: updateError } = await admin.from('conductores').update({
      nombre_servicio: nombre,
      activo:          true,
    }).eq('profile_id', userId);
    if (updateError) throw new Error(`Error actualizando conductor: ${updateError.message}`);
  } else {
    const { error: insertError } = await admin.from('conductores').insert({
      profile_id:      userId,
      nombre_servicio: nombre,
      plazas_vehiculo: 4,
      activo:          true,
    });
    if (insertError) throw new Error(`Error insertando conductor: ${insertError.message}`);
  }

  redirect('/admin');
}

export async function toggleConductor(formData: FormData) {
  await verificarSuperadmin();
  const admin       = createAdminClient();
  const conductorId = formData.get('conductor_id') as string;
  const activo      = formData.get('activo') === 'true';

  await admin.from('conductores').update({ activo: !activo }).eq('id', conductorId);

  // Al desactivar: cancelar viajes abiertos, reservas activas y especiales pendientes
  if (activo) {
    // 1. Obtener viajes abiertos
    const { data: trips } = await admin
      .from('trips')
      .select('id')
      .eq('conductor_id', conductorId)
      .eq('estado', 'abierto');

    const tripIds = (trips ?? []).map(t => t.id);

    if (tripIds.length > 0) {
      // 2. Obtener reservas activas de esos viajes
      const { data: bookings } = await admin
        .from('bookings')
        .select('id, cliente_id, origen, destino, fecha_hora_solicitada')
        .in('trip_id', tripIds)
        .in('estado', ['pendiente', 'confirmada']);

      // 3. Cancelar reservas (sin penalización) y notificar pasajeros
      if (bookings && bookings.length > 0) {
        await admin
          .from('bookings')
          .update({ estado: 'cancelada', penalizacion: 0, cancelada_at: new Date().toISOString() })
          .in('id', bookings.map(b => b.id));

        for (const b of bookings) {
          await notificarBajaConductor({
            pasajeroId: b.cliente_id,
            origen:     b.origen,
            destino:    b.destino,
            fechaHora:  b.fecha_hora_solicitada ?? '',
          });
        }
      }

      // 4. Cerrar los viajes
      await admin
        .from('trips')
        .update({ estado: 'cerrado' })
        .in('id', tripIds);
    }

    // 5. Cancelar servicios especiales activos
    const { data: especiales } = await admin
      .from('special_requests')
      .select('id, cliente_id, origen_texto, destino_texto, fecha_hora')
      .eq('conductor_id', conductorId)
      .in('estado', ['pendiente', 'confirmada']);

    if (especiales && especiales.length > 0) {
      await admin
        .from('special_requests')
        .update({ estado: 'cancelada' })
        .in('id', especiales.map(s => s.id));

      for (const s of especiales) {
        await notificarBajaConductorEspecial({
          pasajeroId:   s.cliente_id,
          origenTexto:  s.origen_texto,
          destinoTexto: s.destino_texto,
          fechaHora:    s.fecha_hora,
        });
      }
    }
  }

  revalidatePath('/admin');
}

export async function eliminarConductor(formData: FormData) {
  await verificarSuperadmin();
  const admin       = createAdminClient();
  const conductorId = formData.get('conductor_id') as string;

  // Cancelar viajes abiertos, reservas activas y especiales pendientes antes de borrar
  const { data: trips } = await admin
    .from('trips')
    .select('id')
    .eq('conductor_id', conductorId)
    .eq('estado', 'abierto');

  const tripIds = (trips ?? []).map(t => t.id);

  if (tripIds.length > 0) {
    const { data: bookings } = await admin
      .from('bookings')
      .select('id, cliente_id, origen, destino, fecha_hora_solicitada')
      .in('trip_id', tripIds)
      .in('estado', ['pendiente', 'confirmada']);

    if (bookings && bookings.length > 0) {
      await admin
        .from('bookings')
        .update({ estado: 'cancelada', penalizacion: 0, cancelada_at: new Date().toISOString() })
        .in('id', bookings.map(b => b.id));

      for (const b of bookings) {
        await notificarBajaConductor({
          pasajeroId: b.cliente_id,
          origen:     b.origen,
          destino:    b.destino,
          fechaHora:  b.fecha_hora_solicitada ?? '',
        });
      }
    }

    await admin.from('trips').update({ estado: 'cerrado' }).in('id', tripIds);
  }

  const { data: especiales } = await admin
    .from('special_requests')
    .select('id, cliente_id, origen_texto, destino_texto, fecha_hora')
    .eq('conductor_id', conductorId)
    .in('estado', ['pendiente', 'confirmada']);

  if (especiales && especiales.length > 0) {
    await admin
      .from('special_requests')
      .update({ estado: 'cancelada' })
      .in('id', especiales.map(s => s.id));

    for (const s of especiales) {
      await notificarBajaConductorEspecial({
        pasajeroId:   s.cliente_id,
        origenTexto:  s.origen_texto,
        destinoTexto: s.destino_texto,
        fechaHora:    s.fecha_hora,
      });
    }
  }

  // Obtener profile_id antes de borrar
  const { data: conductor } = await admin
    .from('conductores')
    .select('profile_id')
    .eq('id', conductorId)
    .single();

  // Eliminar filas que referencian al conductor (FKs sin CASCADE)
  await admin.from('bookings').delete().eq('conductor_id', conductorId);
  await admin.from('trips').delete().eq('conductor_id', conductorId);
  await admin.from('special_requests').delete().eq('conductor_id', conductorId);

  await admin.from('conductores').delete().eq('id', conductorId);

  if (conductor?.profile_id) {
    await admin.from('profiles').delete().eq('id', conductor.profile_id);
    await admin.auth.admin.deleteUser(conductor.profile_id);
  }

  redirect('/admin');
}

export async function cerrarSesionAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
