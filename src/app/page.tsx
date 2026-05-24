export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import MakiCarLogo from '@/components/MakiCarLogo';
import BottomTabs from '@/components/BottomTabs';
import AutoRefresh from '@/components/AutoRefresh';

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    timeZone: 'UTC',
  });
}

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: profile },
    { data: isConductor },
    { data: isAdmin },
  ] = await Promise.all([
    supabase.from('profiles').select('nombre, rol, conductor_id').eq('id', user.id).single(),
    supabase.rpc('es_conductor_activo'),
    supabase.rpc('es_superadmin'),
  ]);

  if (isConductor) redirect('/conductor');
  if (isAdmin)     redirect('/admin');

  let trips = null;
  if (profile?.conductor_id) {
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('conductor_id', profile.conductor_id)
      .eq('estado', 'abierto')
      .gte('fecha_hora', new Date().toISOString())
      .order('fecha_hora', { ascending: true });
    trips = data;
  }

  return (
    <div className="flex flex-col min-h-screen bg-noche">
      <div className="sticky top-0 z-10 bg-[#0D1117] border-b border-linea px-5 pt-10 pb-3.5 flex justify-between items-center">
        <MakiCarLogo />
        <div className="flex items-center gap-2">
          <AutoRefresh />
          <span className="text-gris text-[11px]">Hola, {profile?.nombre || 'usuario'}</span>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 overflow-y-auto">
        <h2 className="font-fraunces text-[23px] font-semibold mb-1">Viajes disponibles</h2>
        <p className="text-gris text-[13px] mb-5">Próximos viajes con plaza libre</p>

        {!profile?.conductor_id ? (
          <div className="bg-carta border border-linea rounded-xl p-6 text-center mb-4">
            <p className="text-blanco font-semibold mb-2">Sin conductor asignado</p>
            <p className="text-gris text-sm">Contacta con tu conductor para recibir tu enlace de acceso.</p>
          </div>
        ) : !trips?.length ? (
          <div className="bg-carta border border-linea rounded-xl p-6 text-center mb-4">
            <p className="text-gris text-sm mb-1">No hay viajes programados próximamente.</p>
            <p className="text-gris text-xs">Consulta más tarde o solicita un servicio especial.</p>
          </div>
        ) : (
          <div className="mb-4">
            {trips.map(t => (
              <div key={t.id} className="bg-carta border border-linea rounded-xl p-4 mb-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-[16px]">{t.origen_cabecera} → {t.destino_cabecera}</span>
                  <span className="font-fraunces text-ambar text-[18px] font-semibold">{t.precio} €</span>
                </div>
                <p className="text-gris text-[12px] mb-3">
                  {formatFecha(t.fecha_hora)} · {t.plazas_libres} {t.plazas_libres === 1 ? 'plaza libre' : 'plazas libres'}
                </p>
                {t.plazas_libres > 0 ? (
                  <Link
                    href={`/reservar/${t.id}`}
                    className="block w-full bg-ambar text-noche text-center font-bold rounded-xl py-2.5 text-[14px] active:scale-[.98] transition-transform"
                  >
                    Reservar plaza
                  </Link>
                ) : (
                  <p className="w-full text-center text-gris text-[13px] border border-linea rounded-xl py-2.5">
                    Sin plazas disponibles
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <Link
          href="/especial"
          className="block w-full text-center border border-linea text-gris rounded-xl py-4 text-[14px] font-bold"
        >
          Servicio especial (aeropuerto, etc.) → consultar
        </Link>
      </div>

      <BottomTabs />
    </div>
  );
}
