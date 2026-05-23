import Link from 'next/link';
import { crearSolicitudEspecial } from './actions';
import BottomTabs from '@/components/BottomTabs';

export default function EspecialPage() {
  return (
    <div className="flex flex-col min-h-screen bg-noche">
      {/* TopBar */}
      <div className="sticky top-0 z-10 bg-[#0D1117] border-b border-linea px-5 pt-10 pb-3.5 flex items-center justify-between">
        <Link href="/" className="text-ambar font-semibold text-[13px]">‹ Volver</Link>
        <span className="text-gris text-[11px]">A medida</span>
      </div>

      <div className="flex-1 px-5 py-5">
        <h2 className="font-fraunces text-[23px] font-semibold mb-1">Servicio especial</h2>
        <p className="text-gris text-[13px] mb-5">
          Aeropuerto, horarios fuera de ruta… El conductor te dice precio y confirma.
        </p>

        <form action={crearSolicitudEspecial} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-gris text-xs mb-1.5">Origen</label>
            <input
              name="origen"
              type="text"
              required
              placeholder="Ej: Motril, paseo marítimo"
              className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar"
            />
          </div>

          <div>
            <label className="block text-gris text-xs mb-1.5">Destino</label>
            <input
              name="destino"
              type="text"
              required
              placeholder="Ej: Aeropuerto de Málaga (AGP)"
              className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar"
            />
          </div>

          <div>
            <label className="block text-gris text-xs mb-1.5">Día y hora</label>
            <input
              name="fecha"
              type="datetime-local"
              required
              className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm focus:outline-none focus:border-ambar"
            />
          </div>

          <div>
            <label className="block text-gris text-xs mb-1.5">Pasajeros</label>
            <select
              name="pasajeros"
              className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm focus:outline-none focus:border-ambar"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="bg-[rgba(255,182,39,.08)] border border-[rgba(255,182,39,.25)] text-[#ffd98a] text-xs rounded-xl px-3.5 py-3 leading-relaxed">
            El conductor revisará tu petición y te enviará el precio. Sin compromiso hasta que aceptes.
          </div>

          <button
            type="submit"
            className="w-full bg-ambar text-noche font-bold rounded-xl py-4 text-[15px] active:scale-[.98] transition-transform mt-1"
          >
            Enviar petición al conductor
          </button>
        </form>
      </div>

      <BottomTabs />
    </div>
  );
}
