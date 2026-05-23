export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import MakiCarLogo from '@/components/MakiCarLogo';
import { crearConductor, toggleConductor, cerrarSesionAdmin } from './actions';

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <p className="text-gris text-xs uppercase tracking-wider mb-3">{titulo}</p>
      {children}
    </section>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: isAdmin } = await supabase.rpc('es_superadmin');
  if (!isAdmin) redirect('/');

  const admin = createAdminClient();

  const { data: conductores } = await admin
    .from('conductores')
    .select('*')
    .order('created_at', { ascending: true });

  const profileIds = (conductores ?? []).map(c => c.profile_id);
  const conductorIds = (conductores ?? []).map(c => c.id);

  const [
    { data: perfiles },
    { data: tripsRaw },
    { data: bookingsRaw },
  ] = await Promise.all([
    profileIds.length > 0
      ? admin.from('profiles').select('id, nombre, telefono').in('id', profileIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string; telefono: string | null }[] }),
    conductorIds.length > 0
      ? admin.from('trips').select('conductor_id')
      : Promise.resolve({ data: [] as { conductor_id: string }[] }),
    conductorIds.length > 0
      ? admin.from('bookings').select('conductor_id').in('conductor_id', conductorIds)
      : Promise.resolve({ data: [] as { conductor_id: string }[] }),
  ]);

  const perfilMap = Object.fromEntries((perfiles ?? []).map(p => [p.id, p]));

  const tripsCount = (tripsRaw ?? []).reduce((acc, t) => {
    acc[t.conductor_id] = (acc[t.conductor_id] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bookingsCount = (bookingsRaw ?? []).reduce((acc, b) => {
    acc[b.conductor_id] = (acc[b.conductor_id] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col min-h-screen bg-noche">
      <div className="sticky top-0 z-10 bg-[#0D1117] border-b border-linea px-5 pt-10 pb-3.5 flex justify-between items-center">
        <MakiCarLogo />
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-violeta uppercase tracking-wider">Superadmin</span>
          <form action={cerrarSesionAdmin}>
            <button type="submit" className="text-gris text-[11px] border border-linea rounded-lg px-2.5 py-1 font-semibold active:scale-[.97] transition-transform">
              Salir
            </button>
          </form>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 overflow-y-auto pb-8">

        {/* ── Lista de conductores ───────────────────────── */}
        <Seccion titulo={`Conductores (${conductores?.length ?? 0})`}>
          {!conductores?.length
            ? <p className="text-gris text-sm">No hay conductores registrados.</p>
            : conductores.map(c => {
              const perfil = perfilMap[c.profile_id];
              return (
                <div key={c.id} className="bg-carta border border-linea rounded-xl p-4 mb-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-[14px]">{perfil?.nombre ?? c.nombre_servicio}</span>
                    {c.activo
                      ? <span className="text-ruta text-[10px] font-bold bg-[rgba(43,182,164,.14)] px-2 py-0.5 rounded-full">ACTIVO</span>
                      : <span className="text-gris text-[10px] font-bold bg-[rgba(138,147,166,.14)] px-2 py-0.5 rounded-full">INACTIVO</span>
                    }
                  </div>
                  <p className="text-gris text-[12px]">{c.email}</p>
                  {perfil?.telefono && <p className="text-gris text-[12px]">{perfil.telefono}</p>}
                  <div className="flex gap-4 my-2">
                    <span className="text-gris text-[11px]">{tripsCount[c.id] ?? 0} viajes</span>
                    <span className="text-gris text-[11px]">{bookingsCount[c.id] ?? 0} reservas</span>
                  </div>
                  <form action={toggleConductor}>
                    <input type="hidden" name="conductor_id" value={c.id} />
                    <input type="hidden" name="activo" value={String(c.activo)} />
                    <button
                      type="submit"
                      className={`text-[12px] border rounded-lg px-3 py-1.5 font-semibold active:scale-[.98] transition-transform ${
                        c.activo
                          ? 'text-gris border-linea'
                          : 'text-ambar border-ambar/40'
                      }`}
                    >
                      {c.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </form>
                </div>
              );
            })
          }
        </Seccion>

        {/* ── Nuevo conductor ────────────────────────────── */}
        <Seccion titulo="Nuevo conductor">
          <div className="bg-carta border border-violeta/30 rounded-xl p-4">
            <form action={crearConductor} className="flex flex-col gap-3">
              <div>
                <label className="block text-gris text-[10px] mb-1">Nombre completo</label>
                <input
                  type="text"
                  name="nombre"
                  required
                  placeholder="Nombre del conductor"
                  className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-violeta"
                />
              </div>
              <div>
                <label className="block text-gris text-[10px] mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="conductor@ejemplo.com"
                  className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-violeta"
                />
              </div>
              <div>
                <label className="block text-gris text-[10px] mb-1">Teléfono (opcional)</label>
                <input
                  type="tel"
                  name="telefono"
                  placeholder="+34 600 000 000"
                  className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-violeta"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-violeta text-noche font-bold rounded-xl py-2.5 text-[14px] active:scale-[.98] transition-transform"
              >
                Crear conductor
              </button>
            </form>
          </div>
        </Seccion>

      </div>
    </div>
  );
}
