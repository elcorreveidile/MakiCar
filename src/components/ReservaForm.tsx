'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { calcularPrecio, PARADAS } from '@/lib/tarifas';
import type { Parada, Maleta, Mascota } from '@/lib/tarifas';

// Origen: todas las paradas excepto la última
const ORIGENES = PARADAS.slice(0, -1) as unknown as Parada[];

function destinosPara(origen: Parada): Parada[] {
  const idx = PARADAS.indexOf(origen);
  return PARADAS.slice(idx + 1) as unknown as Parada[];
}

// Formato datetime-local mínimo: ahora + 1 hora
function minDatetime() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

export default function ReservaForm({ nombre }: { nombre: string }) {
  const router = useRouter();
  const [origen, setOrigen] = useState<Parada>('Granada');
  const [destino, setDestino] = useState<Parada>('Málaga');
  const [fecha, setFecha] = useState('');
  const [maleta, setMaleta] = useState<Maleta>('no');
  const [mascota, setMascota] = useState<Mascota>('no');

  const destinos = destinosPara(origen);

  function handleOrigenChange(v: Parada) {
    setOrigen(v);
    const nuevosDestinos = destinosPara(v);
    if (!nuevosDestinos.includes(destino)) setDestino(nuevosDestinos[0]);
  }

  const resultado = useMemo(() => {
    if (!fecha) return null;
    try {
      return { ok: calcularPrecio({ origen, destino, fechaHora: new Date(fecha), maleta, mascota }) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [origen, destino, fecha, maleta, mascota]);

  function continuar() {
    if (!resultado?.ok) return;
    const p = new URLSearchParams({ origen, destino, fecha, maleta, mascota });
    router.push(`/pago?${p}`);
  }

  const precio = resultado?.ok;
  const errorMsg = resultado?.error;

  return (
    <div className="flex flex-col min-h-screen bg-noche">
      {/* TopBar */}
      <div className="sticky top-0 z-10 bg-[#0D1117] border-b border-linea px-5 pt-10 pb-3.5 flex justify-between items-center">
        <span className="font-sora font-extrabold text-[19px] tracking-tight">
          Maki<span className="text-ambar">Car</span>
        </span>
        <span className="text-gris text-[11px]">Hola, {nombre}</span>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 py-5 overflow-y-auto">
        <h2 className="font-fraunces text-[23px] font-semibold mb-1">Reservar plaza</h2>
        <p className="text-gris text-[13px] mb-4">Ruta Granada · Málaga · Marbella · Estepona · Algeciras</p>

        {/* Origen */}
        <div className="mb-3.5">
          <label className="block text-gris text-xs mb-1.5">Subo en</label>
          <select
            value={origen}
            onChange={(e) => handleOrigenChange(e.target.value as Parada)}
            className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm focus:outline-none focus:border-ambar"
          >
            {ORIGENES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Destino */}
        <div className="mb-3.5">
          <label className="block text-gris text-xs mb-1.5">Bajo en</label>
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value as Parada)}
            className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm focus:outline-none focus:border-ambar"
          >
            {destinos.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Fecha y hora */}
        <div className="mb-3.5">
          <label className="block text-gris text-xs mb-1.5">Día y hora</label>
          <input
            type="datetime-local"
            min={minDatetime()}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm focus:outline-none focus:border-ambar"
          />
        </div>

        {/* Maleta */}
        <div className="mb-3.5">
          <label className="block text-gris text-xs mb-1.5">Equipaje</label>
          <select
            value={maleta}
            onChange={(e) => setMaleta(e.target.value as Maleta)}
            className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm focus:outline-none focus:border-ambar"
          >
            <option value="no">Sin maleta grande</option>
            <option value="maletero">Maleta en maletero (+5 €)</option>
            <option value="asiento">Maleta en asiento (plaza completa)</option>
          </select>
        </div>

        {/* Mascota */}
        <div className="mb-3.5">
          <label className="block text-gris text-xs mb-1.5">¿Viajas con mascota? 🐾 (avisa siempre)</label>
          <select
            value={mascota}
            onChange={(e) => setMascota(e.target.value as Mascota)}
            className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm focus:outline-none focus:border-ambar"
          >
            <option value="no">No llevo mascota</option>
            <option value="pies">A los pies / regazo (+5 €)</option>
            <option value="asiento">Ocupa asiento (plaza completa)</option>
          </select>
        </div>

        {/* Normas */}
        <div className="bg-[rgba(43,182,164,.08)] border border-[rgba(43,182,164,.25)] text-[#9fe7dc] text-xs rounded-xl px-3.5 py-3 mb-4 leading-relaxed">
          🚭 Prohibido fumar &nbsp;·&nbsp; 🐾 Se admiten mascotas (avisando antes)
        </div>

        {/* PriceBox */}
        {!fecha ? (
          <div className="bg-carta border border-linea rounded-xl p-4 mb-4 text-gris text-[13px] text-center">
            Selecciona fecha y hora para ver el precio
          </div>
        ) : errorMsg ? (
          <div className="bg-carta border border-linea rounded-xl p-4 mb-4 text-[#E5544B] text-[13px] text-center">
            {errorMsg.includes('sin servicio')
              ? `Sin servicio en este tramo (${origen} → ${destino})`
              : errorMsg}
          </div>
        ) : precio ? (
          <div className="bg-carta border border-linea rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center text-[13px] py-1 text-gris">
              <span>Tramo</span>
              <span className="text-blanco font-medium">{origen} → {destino}</span>
            </div>
            <div className="flex justify-between items-center text-[13px] py-1 text-gris">
              <span>Tarifa</span>
              <span>
                {precio.esNoche
                  ? <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(155,140,255,.14)] text-violeta">NOCHE · 21:00–6:00</span>
                  : <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(255,182,39,.14)] text-ambar">DÍA</span>
                }
                &nbsp;{precio.precioBase} €
              </span>
            </div>
            {maleta === 'maletero' && (
              <div className="flex justify-between items-center text-[13px] py-1 text-gris">
                <span>Maleta (maletero)</span><span className="text-blanco">+5 €</span>
              </div>
            )}
            {maleta === 'asiento' && (
              <div className="flex justify-between items-center text-[13px] py-1 text-gris">
                <span>Maleta (plaza completa)</span><span className="text-blanco">+{precio.precioBase} €</span>
              </div>
            )}
            {mascota === 'pies' && (
              <div className="flex justify-between items-center text-[13px] py-1 text-gris">
                <span>Mascota (a los pies)</span><span className="text-blanco">+5 €</span>
              </div>
            )}
            {mascota === 'asiento' && (
              <div className="flex justify-between items-center text-[13px] py-1 text-gris">
                <span>Mascota (plaza completa)</span><span className="text-blanco">+{precio.precioBase} €</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 mt-2 border-t border-linea">
              <span className="text-[13px] text-gris">Total a pagar al conductor</span>
              <span className="font-fraunces text-2xl text-ambar font-semibold">{precio.total} €</span>
            </div>
          </div>
        ) : null}

        <button
          onClick={continuar}
          disabled={!precio}
          className="w-full bg-ambar text-noche font-bold rounded-xl py-4 text-[15px] active:scale-[.98] transition-transform disabled:opacity-40 mb-2.5"
        >
          Continuar
        </button>
        <a
          href="/especial"
          className="block w-full text-center border border-linea text-gris rounded-xl py-4 text-[15px] font-bold"
        >
          Servicio especial (aeropuerto, etc.) → consultar
        </a>
      </div>

      {/* Bottom tabs imported here via import in page.tsx */}
    </div>
  );
}
