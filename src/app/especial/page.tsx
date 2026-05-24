import Link from 'next/link';
import BottomTabs from '@/components/BottomTabs';
import EspecialForm from './EspecialForm';

export default function EspecialPage() {
  return (
    <div className="flex flex-col min-h-screen bg-noche">
      <div className="sticky top-0 z-10 bg-[#0D1117] border-b border-linea px-5 pt-10 pb-3.5 flex items-center justify-between">
        <Link href="/" className="text-ambar font-semibold text-[13px]">‹ Volver</Link>
        <span className="text-gris text-[11px]">A medida</span>
      </div>

      <div className="flex-1 px-5 py-5">
        <h2 className="font-fraunces text-[23px] font-semibold mb-1">Servicio especial</h2>
        <p className="text-gris text-[13px] mb-5">
          Aeropuerto, horarios fuera de ruta… El conductor te dice precio y confirma.
        </p>
        <EspecialForm />
      </div>

      <BottomTabs />
    </div>
  );
}
