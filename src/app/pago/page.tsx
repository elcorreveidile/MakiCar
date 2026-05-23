import { calcularPrecio } from '@/lib/tarifas';
import type { Parada, Maleta, Mascota } from '@/lib/tarifas';
import { crearReserva } from './actions';
import PagoOpciones from './PagoOpciones';
import Link from 'next/link';

export default async function PagoPage({
  searchParams,
}: {
  searchParams: Promise<{ origen?: string; destino?: string; fecha?: string; maleta?: string; mascota?: string }>;
}) {
  const p = await searchParams;

  let precio;
  try {
    precio = calcularPrecio({
      origen:    (p.origen  || 'Granada')  as Parada,
      destino:   (p.destino || 'Málaga')   as Parada,
      fechaHora: new Date(p.fecha || ''),
      maleta:    (p.maleta  || 'no')       as Maleta,
      mascota:   (p.mascota || 'no')       as Mascota,
    });
  } catch {
    return (
      <div className="min-h-screen bg-noche flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-[#E5544B] mb-4">Datos de reserva no válidos.</p>
          <Link href="/" className="text-ambar text-sm">← Volver</Link>
        </div>
      </div>
    );
  }

  const resumen = `${p.origen} → ${p.destino} · ${precio.total} €`;

  return (
    <div className="flex flex-col min-h-screen bg-noche">
      {/* TopBar */}
      <div className="sticky top-0 z-10 bg-[#0D1117] border-b border-linea px-5 pt-10 pb-3.5 flex items-center justify-between">
        <Link href="/" className="text-ambar font-semibold text-[13px]">‹ Volver</Link>
        <span className="text-gris text-[11px]">Pago</span>
      </div>

      <div className="flex-1 px-5 py-5">
        <h2 className="font-fraunces text-[23px] font-semibold mb-1">¿Cómo pagas?</h2>
        <p className="text-gris text-[13px] mb-5">{resumen}</p>

        {/* Resumen precio */}
        <div className="bg-carta border border-linea rounded-xl p-4 mb-5">
          <div className="flex justify-between text-[13px] py-1 text-gris">
            <span>Tramo</span>
            <span className="text-blanco">{p.origen} → {p.destino}</span>
          </div>
          <div className="flex justify-between text-[13px] py-1 text-gris">
            <span>Tarifa</span>
            <span>
              {precio.esNoche
                ? <span className="text-violeta font-bold text-[10px] bg-[rgba(155,140,255,.14)] px-2 py-0.5 rounded-full">NOCHE</span>
                : <span className="text-ambar font-bold text-[10px] bg-[rgba(255,182,39,.14)] px-2 py-0.5 rounded-full">DÍA</span>
              }
              &nbsp;{precio.precioBase} €
            </span>
          </div>
          {precio.suplementos > 0 && (
            <div className="flex justify-between text-[13px] py-1 text-gris">
              <span>Suplementos</span>
              <span className="text-blanco">+{precio.suplementos} €</span>
            </div>
          )}
          <div className="flex justify-between pt-3 mt-2 border-t border-linea">
            <span className="text-[13px] text-gris">Total</span>
            <span className="font-fraunces text-2xl text-ambar font-semibold">{precio.total} €</span>
          </div>
        </div>

        {/* Formulario con Server Action — opciones de pago gestionadas en cliente */}
        <form action={crearReserva}>
          <input type="hidden" name="origen"   value={p.origen}  />
          <input type="hidden" name="destino"  value={p.destino} />
          <input type="hidden" name="fecha"    value={p.fecha}   />
          <input type="hidden" name="maleta"   value={p.maleta}  />
          <input type="hidden" name="mascota"  value={p.mascota} />

          {/* Opciones de pago (componente cliente que gestiona el estado) */}
          <PagoOpciones />

          {/* Dirección de recogida */}
          <div className="mb-3.5">
            <label className="block text-gris text-xs mb-1.5">Dirección de recogida</label>
            <input
              name="dir_recogida"
              type="text"
              placeholder="Calle, número, ciudad…"
              className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar"
            />
          </div>

          <div className="bg-[rgba(43,182,164,.08)] border border-[rgba(43,182,164,.25)] text-[#9fe7dc] text-xs rounded-xl px-3.5 py-3 mb-5 leading-relaxed">
            ⏳ Toda reserva queda <strong>pendiente de aprobación</strong>. El conductor revisa y confirma; recibirás un aviso.
          </div>

          <button
            type="submit"
            className="w-full bg-ambar text-noche font-bold rounded-xl py-4 text-[15px] active:scale-[.98] transition-transform"
          >
            Enviar solicitud
          </button>
        </form>
      </div>
    </div>
  );
}
