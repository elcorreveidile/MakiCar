export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import MakiCarLogo from '@/components/MakiCarLogo';
import { toggleConductor, cerrarSesionAdmin } from './actions';
import EliminarConductorButton from './EliminarConductorButton';
import NuevoConductorForm from './NuevoConductorForm';

const BILLING_LABELS: Record<string, { label: string; color: string }> = {
  active:           { label: 'Al corriente',   color: 'text-ruta bg-[rgba(43,182,164,.14)]' },
  past_due:         { label: 'Pago atrasado',  color: 'text-[#FFB627] bg-[rgba(255,182,39,.14)]' },
  unpaid:           { label: 'Sin pagar',      color: 'text-[#E5544B] bg-[rgba(229,84,75,.14)]' },
  canceled:         { label: 'Cancelada',      color: 'text-gris bg-[rgba(138,147,166,.14)]' },
  trialing:         { label: 'En prueba',      color: 'text-violeta bg-[rgba(155,140,255,.14)]' },
  sin_suscripcion:  { label: 'Sin facturar',   color: 'text-gris bg-[rgba(138,147,166,.14)]' },
};

function BillingBadge({ status }: { status: string }) {
  const { label, color } = BILLING_LABELS[status] ?? BILLING_LABELS['sin_suscripcion'];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
}

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
    authUsersResult,
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
    profileIds.length > 0
      ? admin.auth.admin.listUsers({ perPage: 1000 })
      : Promise.resolve({ data: { users: [] } }),
  ]);

  const perfilMap = Object.fromEntries((perfiles ?? []).map(p => [p.id, p]));
  const authEmailMap = Object.fromEntries(
    (authUsersResult.data?.users ?? []).map(u => [u.id, u.email ?? ''])
  );

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
                    <div className="flex flex-col items-end gap-1">
                      {c.activo
                        ? <span className="text-ruta text-[10px] font-bold bg-[rgba(43,182,164,.14)] px-2 py-0.5 rounded-full">ACTIVO</span>
                        : <span className="text-gris text-[10px] font-bold bg-[rgba(138,147,166,.14)] px-2 py-0.5 rounded-full">INACTIVO</span>
                      }
                      <BillingBadge status={c.makicar_stripe_subscription_status ?? 'sin_suscripcion'} />
                    </div>
                  </div>
                  <p className="text-gris text-[12px]">{c.email ?? authEmailMap[c.profile_id] ?? ''}</p>
                  {perfil?.telefono && <p className="text-gris text-[12px]">{perfil.telefono}</p>}
                  <div className="flex gap-4 my-2">
                    <span className="text-gris text-[11px]">{tripsCount[c.id] ?? 0} viajes</span>
                    <span className="text-gris text-[11px]">{bookingsCount[c.id] ?? 0} reservas</span>
                  </div>
                  <div className="flex gap-2">
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
                    <EliminarConductorButton
                      conductorId={c.id}
                      nombre={perfil?.nombre ?? c.nombre_servicio}
                    />
                  </div>
                </div>
              );
            })
          }
        </Seccion>

        {/* ── Nuevo conductor ────────────────────────────── */}
        <Seccion titulo="Nuevo conductor">
          <div className="bg-carta border border-violeta/30 rounded-xl p-4">
            <NuevoConductorForm />
          </div>
        </Seccion>

      </div>
    </div>
  );
}
