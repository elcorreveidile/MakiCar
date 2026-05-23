import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import MakiCarLogo from '@/components/MakiCarLogo';
import BookingForm from './BookingForm';

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
            <span className="font-fraunces text-ambar text-[22px] font-semibold">{trip.precio} €</span>
          </div>
          <p className="text-gris text-[12px] capitalize">{fechaLarga}</p>
          <p className="text-gris text-[11px] mt-1">
            {trip.plazas_libres} {trip.plazas_libres === 1 ? 'plaza libre' : 'plazas libres'}
          </p>
        </div>

        {trip.plazas_libres > 0 ? (
          <BookingForm trip={{ id: trip.id, precio: trip.precio }} />
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
