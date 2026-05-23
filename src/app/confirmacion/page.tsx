import Link from 'next/link';

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const esEspecial = tipo === 'especial';

  return (
    <div className="min-h-screen bg-noche flex flex-col">
      {/* TopBar */}
      <div className="bg-[#0D1117] border-b border-linea px-5 pt-10 pb-3.5 flex justify-between items-center">
        <span className="font-sora font-extrabold text-[19px] tracking-tight">
          Maki<span className="text-ambar">Car</span>
        </span>
      </div>

      {/* Success */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
        <div className="w-[84px] h-[84px] rounded-full border-[3px] border-ambar flex items-center justify-center text-[38px] text-ambar mb-6">
          ⏳
        </div>
        <h2 className="font-fraunces text-[23px] font-semibold mb-3">Solicitud enviada</h2>
        <p className="text-gris text-sm leading-relaxed mb-8">
          {esEspecial
            ? 'Tu petición especial está pendiente. El conductor te enviará precio y confirmación en breve.'
            : 'Tu reserva está pendiente de la aprobación del conductor. Te avisamos en cuanto la confirme.'}
        </p>
        <Link
          href="/mis-viajes"
          className="w-full bg-ambar text-noche font-bold rounded-xl py-4 text-[15px] text-center block active:scale-[.98] transition-transform"
        >
          Ver mis viajes
        </Link>
        <Link href="/" className="mt-3 text-gris text-sm">
          Nueva reserva
        </Link>
      </div>
    </div>
  );
}
