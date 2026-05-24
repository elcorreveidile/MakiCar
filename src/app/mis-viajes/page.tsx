import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cancelarEspecial } from './actions';
import CancelarReservaButton from './CancelarReservaButton';
import BottomTabs from '@/components/BottomTabs';
import MakiCarLogo from '@/components/MakiCarLogo';
import Footer from '@/components/Footer';

const ESTADO_BADGE: Record<string, { label: string; classes: string }> = {
  pendiente:  { label: 'PENDIENTE',  classes: 'text-ambar bg-[rgba(255,182,39,.14)]'  },
  confirmada: { label: 'CONFIRMADA', classes: 'text-ruta bg-[rgba(43,182,164,.14)]'   },
  rechazada:  { label: 'RECHAZADA',  classes: 'text-[#E5544B] bg-[rgba(229,84,75,.14)]' },
  completada: { label: 'COMPLETADA', classes: 'text-gris bg-[rgba(138,147,166,.14)]'  },
  cancelada:  { label: 'CANCELADA',  classes: 'text-gris bg-[rgba(138,147,166,.14)]'  },
};

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default async function MisViajesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, trips(fecha_hora)')
    .eq('cliente_id', user.id)
    .order('created_at', { ascending: false });

  const { data: especiales } = await supabase
    .from('special_requests')
    .select('*')
    .eq('cliente_id', user.id)
    .order('created_at', { ascending: false });

  const puedesCancelar = (estado: string) => ['pendiente', 'confirmada'].includes(estado);

  return (
    <div className="flex flex-col min-h-screen bg-noche">
      {/* TopBar */}
      <div className="sticky top-0 z-10 bg-[#0D1117] border-b border-linea px-5 pt-10 pb-3.5 flex justify-between items-center">
        <MakiCarLogo />
        <div className="flex items-center gap-3">
          <span className="text-gris text-[11px]">Mis viajes</span>
          <Link
            href="/perfil"
            className="text-gris text-[11px] border border-linea rounded-lg px-2.5 py-1 font-semibold active:scale-[.97] transition-transform"
          >
            Perfil
          </Link>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 overflow-y-auto">
        <h2 className="font-fraunces text-[23px] font-semibold mb-1">Mis reservas</h2>
        <p className="text-gris text-[13px] mb-5">
          {(bookings?.length || 0) + (especiales?.length || 0)} reservas
        </p>

        {/* Reservas troncales */}
        {bookings && bookings.length > 0 && bookings.map((b) => {
          const badge = ESTADO_BADGE[b.estado] || ESTADO_BADGE.pendiente;
          const fechaViaje = b.fecha_hora_solicitada || (b.trips as { fecha_hora: string } | null)?.fecha_hora || null;
          return (
            <div key={b.id} className="bg-carta border border-linea rounded-xl p-4 mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-[14px]">{b.origen} → {b.destino}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.classes}`}>
                  {badge.label}
                </span>
              </div>
              <div className="text-gris text-[12px] leading-relaxed mb-3">
                {formatFecha(fechaViaje)}<br />
                {b.precio_total} € ·{' '}
                <span className={b.forma_pago === 'tarjeta' ? 'text-ruta' : 'text-ambar'}>
                  {b.forma_pago.toUpperCase()}
                </span>
                {b.penalizacion > 0 && (
                  <span className="text-[#E5544B]"> · Penalización: {b.penalizacion} €</span>
                )}
              </div>
              {puedesCancelar(b.estado) && (
                <CancelarReservaButton
                  bookingId={b.id}
                  fechaViaje={fechaViaje}
                  precioTotal={b.precio_total}
                />
              )}
            </div>
          );
        })}

        {/* Servicios especiales */}
        {especiales && especiales.length > 0 && (
          <>
            <p className="text-gris text-xs uppercase tracking-wider mb-3 mt-5">Servicios especiales</p>
            {especiales.map((s) => {
              const badge = ESTADO_BADGE[s.estado] || ESTADO_BADGE.pendiente;
              return (
                <div key={s.id} className="bg-carta border border-linea rounded-xl p-4 mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-[14px]">{s.origen_texto} → {s.destino_texto}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.classes}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="text-gris text-[12px] leading-relaxed mb-3">
                    {formatFecha(s.fecha_hora)} · {s.num_pasajeros} pax
                    {s.precio_propuesto && ` · ${s.precio_propuesto} €`}
                  </div>
                  {['pendiente', 'confirmada'].includes(s.estado) && (
                    <form action={cancelarEspecial}>
                      <input type="hidden" name="sr_id" value={s.id} />
                      <button
                        type="submit"
                        className="text-[13px] text-gris border border-linea rounded-lg px-3 py-1.5 font-semibold active:scale-[.98] transition-transform"
                      >
                        Cancelar solicitud
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </>
        )}

        {(!bookings?.length && !especiales?.length) && (
          <div className="text-center py-16 text-gris text-sm">
            <div className="text-4xl mb-4">🗓️</div>
            <p>Aún no tienes reservas.</p>
            <a href="/" className="text-ambar mt-3 block">Reservar plaza →</a>
          </div>
        )}

      </div>

      <Footer />
      <BottomTabs />
    </div>
  );
}
