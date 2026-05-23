import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  confirmarReserva, rechazarReserva, completarReserva,
  confirmarEspecial, rechazarEspecial,
  saldaDeuda, cerrarSesionConductor,
} from './actions';

function formatFecha(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <p className="text-gris text-xs uppercase tracking-wider mb-3">{titulo}</p>
      {children}
    </section>
  );
}

export default async function ConductorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: esConductor } = await supabase.rpc('es_conductor_activo');
  if (!esConductor) redirect('/');

  const { data: conductorId } = await supabase.rpc('mi_conductor_id');
  if (!conductorId) redirect('/');

  const [{ data: bookings }, { data: especiales }, { data: deudas }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*')
      .eq('conductor_id', conductorId)
      .in('estado', ['pendiente', 'confirmada'])
      .order('created_at', { ascending: false }),
    supabase
      .from('special_requests')
      .select('*')
      .eq('conductor_id', conductorId)
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false }),
    supabase
      .from('deudas')
      .select('*, profiles!deudas_cliente_id_fkey(nombre)')
      .eq('conductor_id', conductorId)
      .eq('saldada', false)
      .order('created_at', { ascending: false }),
  ]);

  const pendientes  = bookings?.filter(b => b.estado === 'pendiente')  ?? [];
  const confirmadas = bookings?.filter(b => b.estado === 'confirmada') ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-noche">
      {/* TopBar */}
      <div className="sticky top-0 z-10 bg-[#0D1117] border-b border-linea px-5 pt-10 pb-3.5 flex justify-between items-center">
        <span className="font-sora font-extrabold text-[19px] tracking-tight">
          Maki<span className="text-ambar">Car</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-gris text-[11px]">Panel conductor</span>
          <form action={cerrarSesionConductor}>
            <button type="submit" className="text-gris text-[11px] border border-linea rounded-lg px-2.5 py-1 font-semibold active:scale-[.97] transition-transform">
              Salir
            </button>
          </form>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 overflow-y-auto pb-8">

        {/* Reservas pendientes */}
        <Seccion titulo={`Reservas pendientes (${pendientes.length})`}>
          {pendientes.length === 0
            ? <p className="text-gris text-sm">Sin reservas pendientes.</p>
            : pendientes.map(b => (
              <div key={b.id} className="bg-carta border border-linea rounded-xl p-4 mb-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-[14px]">{b.origen} → {b.destino}</span>
                  <span className="text-ambar text-[10px] font-bold bg-[rgba(255,182,39,.14)] px-2 py-0.5 rounded-full">PENDIENTE</span>
                </div>
                <div className="text-gris text-[12px] leading-relaxed mb-3">
                  {formatFecha(b.fecha_hora_solicitada)}<br />
                  {b.precio_total} € · {b.forma_pago.toUpperCase()}
                  {b.maleta !== 'no' && ` · Maleta: ${b.maleta}`}
                  {b.mascota !== 'no' && ` · Mascota: ${b.mascota}`}
                </div>
                <div className="flex gap-2">
                  <form action={confirmarReserva} className="flex-1">
                    <input type="hidden" name="booking_id" value={b.id} />
                    <button type="submit" className="w-full bg-ruta text-noche text-[13px] font-bold rounded-lg py-2 active:scale-[.98] transition-transform">
                      Confirmar
                    </button>
                  </form>
                  <form action={rechazarReserva} className="flex-1">
                    <input type="hidden" name="booking_id" value={b.id} />
                    <button type="submit" className="w-full border border-[rgba(229,84,75,.5)] text-[#E5544B] text-[13px] font-bold rounded-lg py-2 active:scale-[.98] transition-transform">
                      Rechazar
                    </button>
                  </form>
                </div>
              </div>
            ))
          }
        </Seccion>

        {/* Reservas confirmadas → marcar completada */}
        {confirmadas.length > 0 && (
          <Seccion titulo={`Confirmadas — pendientes de realizar (${confirmadas.length})`}>
            {confirmadas.map(b => (
              <div key={b.id} className="bg-carta border border-linea rounded-xl p-4 mb-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-[14px]">{b.origen} → {b.destino}</span>
                  <span className="text-ruta text-[10px] font-bold bg-[rgba(43,182,164,.14)] px-2 py-0.5 rounded-full">CONFIRMADA</span>
                </div>
                <div className="text-gris text-[12px] leading-relaxed mb-3">
                  {formatFecha(b.fecha_hora_solicitada)} · {b.precio_total} €
                </div>
                <form action={completarReserva}>
                  <input type="hidden" name="booking_id" value={b.id} />
                  <button type="submit" className="text-[13px] text-gris border border-linea rounded-lg px-3 py-1.5 font-semibold active:scale-[.98] transition-transform">
                    Marcar como completada
                  </button>
                </form>
              </div>
            ))}
          </Seccion>
        )}

        {/* Servicios especiales */}
        <Seccion titulo={`Servicios especiales pendientes (${especiales?.length ?? 0})`}>
          {!especiales?.length
            ? <p className="text-gris text-sm">Sin solicitudes especiales.</p>
            : especiales.map(s => (
              <div key={s.id} className="bg-carta border border-linea rounded-xl p-4 mb-3">
                <div className="font-semibold text-[14px] mb-1">{s.origen_texto} → {s.destino_texto}</div>
                <div className="text-gris text-[12px] leading-relaxed mb-3">
                  {formatFecha(s.fecha_hora)} · {s.num_pasajeros} pax
                </div>
                <form action={confirmarEspecial} className="flex flex-col gap-2 mb-2">
                  <input type="hidden" name="sr_id" value={s.id} />
                  <div className="flex gap-2">
                    <input
                      name="precio"
                      type="number"
                      min="0"
                      step="0.5"
                      required
                      placeholder="Precio €"
                      className="flex-1 bg-[#0D1117] border border-linea rounded-lg px-3 py-2 text-blanco text-sm focus:outline-none focus:border-ambar"
                    />
                    <select
                      name="forma_pago"
                      className="bg-[#0D1117] border border-linea rounded-lg px-3 py-2 text-blanco text-sm focus:outline-none focus:border-ambar"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-ruta text-noche text-[13px] font-bold rounded-lg py-2 active:scale-[.98] transition-transform">
                    Confirmar con este precio
                  </button>
                </form>
                <form action={rechazarEspecial}>
                  <input type="hidden" name="sr_id" value={s.id} />
                  <button type="submit" className="w-full border border-[rgba(229,84,75,.5)] text-[#E5544B] text-[13px] font-bold rounded-lg py-2 active:scale-[.98] transition-transform">
                    Rechazar solicitud
                  </button>
                </form>
              </div>
            ))
          }
        </Seccion>

        {/* Deudas */}
        {(deudas?.length ?? 0) > 0 && (
          <Seccion titulo={`Deudas pendientes (${deudas!.length})`}>
            {deudas!.map(d => {
              const cliente = (d.profiles as { nombre: string } | null);
              return (
                <div key={d.id} className="bg-carta border border-linea rounded-xl p-4 mb-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-[14px]">{cliente?.nombre ?? 'Cliente'}</p>
                    <p className="text-gris text-[12px]">{d.importe} € · penalización</p>
                  </div>
                  <form action={saldaDeuda}>
                    <input type="hidden" name="deuda_id" value={d.id} />
                    <button type="submit" className="text-[12px] text-gris border border-linea rounded-lg px-3 py-1.5 font-semibold active:scale-[.98] transition-transform">
                      Saldar
                    </button>
                  </form>
                </div>
              );
            })}
          </Seccion>
        )}

      </div>
    </div>
  );
}
