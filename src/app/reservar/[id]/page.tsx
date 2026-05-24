import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import MakiCarLogo from '@/components/MakiCarLogo';
import BookingForm from './BookingForm';

export default async function ReservarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .eq('estado', 'abierto')
    .single();

  if (!trip) redirect('/');

  const fechaLarga = new Date(trip.fecha_hora).toLocaleString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="flex flex-col min-h-screen bg-noche">
      <div className="sticky top-0 z-10 bg-[#0D1117] border-b border-linea px-5 pt-10 pb-3.5 flex items-center gap-3">
        <Link href="/" className="text-gris text-xl leading-none pr-1">←</Link>
        <MakiCarLogo />
      </div>

      <div className="flex-1 px-5 py-5 overflow-y-auto pb-8">
        <h2 className="font-fraunces text-[23px] font-semibold mb-4">Reservar plaza</h2>

        {/* Resumen del viaje */}
        <div className="bg-carta border border-ambar/30 rounded-xl p-4 mb-5">
          <div className="flex justify-between items-start mb-1">
            <span className="font-semibold text-[16px]">
              {trip.origen_cabecera} → {trip.destino_cabecera}
            </span>
          </div>
          <p className="text-gris text-[12px] capitalize">{fechaLarga}</p>
          <p className="text-gris text-[11px] mt-1">
            {trip.plazas_libres} {trip.plazas_libres === 1 ? 'plaza libre' : 'plazas libres'} · precio según parada de bajada
          </p>
          {trip.puntos_recogida?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-linea">
              <p className="text-gris text-[10px] uppercase tracking-wider mb-1">Puntos de recogida</p>
              <ul className="flex flex-col gap-0.5">
                {trip.puntos_recogida.map((p: string, i: number) => (
                  <li key={i} className="text-blanco text-[12px]">· {p}</li>
                ))}
              </ul>
            </div>
          )}
          {trip.puntos_llegada?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-linea">
              <p className="text-gris text-[10px] uppercase tracking-wider mb-1">Puntos de llegada</p>
              <ul className="flex flex-col gap-0.5">
                {trip.puntos_llegada.map((p: string, i: number) => (
                  <li key={i} className="text-blanco text-[12px]">· {p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {error === 'ya_reservado' && (
          <div className="bg-[rgba(229,84,75,.10)] border border-[rgba(229,84,75,.35)] rounded-xl px-4 py-3 mb-4 text-[13px] text-[#E5544B]">
            Ya tienes una reserva activa en este viaje. Puedes verla en <Link href="/mis-viajes" className="underline font-semibold">Mis viajes</Link>.
          </div>
        )}

        {trip.plazas_libres > 0 ? (
          <BookingForm trip={{
            id:           trip.id,
            origen:       trip.origen_cabecera,
            destino:      trip.destino_cabecera,
            fechaHora:    trip.fecha_hora,
            plazasLibres: trip.plazas_libres,
          }} />
        ) : (
          <div className="text-center py-10">
            <p className="text-gris mb-4">Este viaje ya no tiene plazas disponibles.</p>
            <Link href="/" className="text-ambar font-semibold">← Volver a viajes</Link>
          </div>
        )}
      </div>
    </div>
  );
}
