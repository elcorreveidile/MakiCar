export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import MakiCarLogo from '@/components/MakiCarLogo';
import { crearConductor, toggleConductor, cerrarSesionAdmin } from './actions';
import EliminarConductorButton from './EliminarConductorButton';

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

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  pendiente:  { label: 'Pendiente',  color: 'text-ambar bg-[rgba(255,182,39,.14)]' },
  confirmada: { label: 'Confirmada', color: 'text-ruta bg-[rgba(43,182,164,.14)]' },
  rechazada:  { label: 'Rechazada',  color: 'text-[#E5544B] bg-[rgba(229,84,75,.14)]' },
  completada: { label: 'Completada', color: 'text-gris bg-[rgba(138,147,166,.14)]' },
  cancelada:  { label: 'Cancelada',  color: 'text-gris bg-[rgba(138,147,166,.14)]' },
};

function EstadoBadge({ estado }: { estado: string }) {
  const { label, color } = ESTADO_LABELS[estado] ?? { label: estado, color: 'text-gris bg-[rgba(138,147,166,.14)]' };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${color}`}>
      {label}
    </span>
  );
}

function KpiCard({ valor, etiqueta, nota, color }: { valor: string | number; etiqueta: string; nota?: string; color?: string }) {
  return (
    <div className="bg-carta border border-linea rounded-xl p-3 flex flex-col items-center text-center gap-0.5">
      <span className={`font-fraunces text-[20px] font-semibold ${color ?? 'text-blanco'}`}>{valor}</span>
      <span className="text-gris text-[10px] uppercase tracking-wider">{etiqueta}</span>
      {nota && <span className="text-gris text-[10px]">{nota}</span>}
    </div>
  );
}

function formatFechaCorta(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

type BookingResumen = {
  id: string;
  trip_id: string | null;
  cliente_id: string;
  origen: string;
  destino: string;
  precio_total: number;
  estado: string;
};

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
    admin.auth.admin.listUsers({ perPage: 1000 }),
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

  // ── Resumen global y viajes en curso ────────────────
  const [
    { data: tripsAbiertos },
    { count: viajesTotales },
    { count: reservasPendientes },
    { count: reservasConfirmadas },
    { count: especialesPendientes },
    { data: deudasPendientes },
    { data: ingresosReservas },
    { data: ingresosEspeciales },
  ] = await Promise.all([
    admin.from('trips').select('*').eq('estado', 'abierto').order('fecha_hora', { ascending: true }),
    admin.from('trips').select('*', { count: 'exact', head: true }),
    admin.from('bookings').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    admin.from('bookings').select('*', { count: 'exact', head: true }).eq('estado', 'confirmada'),
    admin.from('special_requests').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    admin.from('deudas').select('importe').eq('saldada', false),
    admin.from('bookings').select('precio_total').in('estado', ['confirmada', 'completada']),
    admin.from('special_requests').select('precio_propuesto').in('estado', ['confirmada', 'completada']),
  ]);

  const deudaTotal   = (deudasPendientes ?? []).reduce((acc, d) => acc + d.importe, 0);
  const ingresoTotal =
    (ingresosReservas   ?? []).reduce((acc, b) => acc + b.precio_total, 0) +
    (ingresosEspeciales ?? []).reduce((acc, s) => acc + (s.precio_propuesto ?? 0), 0);

  const tripIdsAbiertos = (tripsAbiertos ?? []).map(t => t.id);
  const { data: bookingsEnCurso } = tripIdsAbiertos.length > 0
    ? await admin
        .from('bookings')
        .select('id, trip_id, cliente_id, origen, destino, precio_total, estado')
        .in('trip_id', tripIdsAbiertos)
        .in('estado', ['pendiente', 'confirmada'])
        .order('created_at', { ascending: true })
    : { data: [] as BookingResumen[] };

  const clienteIds = [...new Set((bookingsEnCurso ?? []).map(b => b.cliente_id))];
  const { data: clientesPerfiles } = clienteIds.length > 0
    ? await admin.from('profiles').select('id, nombre').in('id', clienteIds)
    : { data: [] as { id: string; nombre: string }[] };
  const clienteNombreMap = Object.fromEntries((clientesPerfiles ?? []).map(p => [p.id, p.nombre]));

  const conductorNombreMap = Object.fromEntries(
    (conductores ?? []).map(c => [c.id, perfilMap[c.profile_id]?.nombre ?? c.nombre_servicio])
  );

  const bookingsByTrip = (bookingsEnCurso ?? []).reduce((acc, b) => {
    if (!b.trip_id) return acc;
    (acc[b.trip_id] ??= []).push(b);
    return acc;
  }, {} as Record<string, BookingResumen[]>);

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

        {/* ── Resumen global ─────────────────────────────── */}
        <Seccion titulo="Resumen">
          <div className="grid grid-cols-2 gap-3">
            <KpiCard valor={tripsAbiertos?.length ?? 0} etiqueta="Viajes abiertos" nota={`${viajesTotales ?? 0} en total`} />
            <KpiCard valor={reservasPendientes ?? 0} etiqueta="Reservas pendientes" color={(reservasPendientes ?? 0) > 0 ? 'text-ambar' : undefined} />
            <KpiCard valor={reservasConfirmadas ?? 0} etiqueta="Reservas confirmadas" color="text-ruta" />
            <KpiCard valor={especialesPendientes ?? 0} etiqueta="Especiales pendientes" color={(especialesPendientes ?? 0) > 0 ? 'text-ambar' : undefined} />
            <KpiCard valor={`${deudaTotal.toFixed(2)} €`} etiqueta="Deudas pendientes" nota={`${deudasPendientes?.length ?? 0} clientes`} color={deudaTotal > 0 ? 'text-[#E5544B]' : undefined} />
            <KpiCard valor={`${ingresoTotal.toFixed(2)} €`} etiqueta="Ingresos estimados" color="text-ruta" />
          </div>
        </Seccion>

        {/* ── Viajes y reservas en curso ─────────────────── */}
        <Seccion titulo={`Viajes en curso (${tripsAbiertos?.length ?? 0})`}>
          {!tripsAbiertos?.length
            ? <p className="text-gris text-sm">No hay viajes abiertos ahora mismo.</p>
            : tripsAbiertos.map(t => {
              const reservas = bookingsByTrip[t.id] ?? [];
              return (
                <div key={t.id} className="bg-carta border border-linea rounded-xl p-4 mb-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-[14px]">{t.origen_cabecera} → {t.destino_cabecera}</span>
                    <span className="text-gris text-[11px] whitespace-nowrap">{t.plazas_libres}/{t.plazas_totales} libres</span>
                  </div>
                  <p className="text-gris text-[12px] capitalize">{formatFechaCorta(t.fecha_hora)}</p>
                  <p className="text-gris text-[11px]">Conductor: {conductorNombreMap[t.conductor_id] ?? '—'}</p>

                  {reservas.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-linea flex flex-col gap-2">
                      {reservas.map(b => (
                        <div key={b.id} className="flex justify-between items-start gap-2 text-[12px]">
                          <span className="text-blanco">
                            {clienteNombreMap[b.cliente_id] ?? 'Pasajero'}
                            <span className="text-gris"> · {b.origen} → {b.destino} · {b.precio_total} €</span>
                          </span>
                          <EstadoBadge estado={b.estado} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          }
        </Seccion>

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
