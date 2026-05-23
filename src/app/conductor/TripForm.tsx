'use client';
import { useState } from 'react';
import { PARADAS } from '@/lib/tarifas';
import type { Parada } from '@/lib/tarifas';
import { crearViaje } from './actions';

const ORIGENES = PARADAS.slice(0, -1) as unknown as Parada[];

function destinosPara(origen: Parada): Parada[] {
  const idx = PARADAS.indexOf(origen);
  return PARADAS.slice(idx + 1) as unknown as Parada[];
}

export default function TripForm() {
  const [origen, setOrigen] = useState<Parada>('Granada');
  const [destino, setDestino] = useState<Parada>('Málaga');
  const [abierto, setAbierto] = useState(false);

  function handleOrigenChange(v: Parada) {
    setOrigen(v);
    const ds = destinosPara(v);
    if (!ds.includes(destino)) setDestino(ds[0]);
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="w-full border border-dashed border-linea text-gris rounded-xl py-3 text-[13px] font-semibold mb-4 active:scale-[.98] transition-transform"
      >
        + Publicar nuevo viaje
      </button>
    );
  }

  return (
    <form
      action={async (fd) => { await crearViaje(fd); setAbierto(false); }}
      className="bg-carta border border-ambar/30 rounded-xl p-4 mb-4 flex flex-col gap-3"
    >
      <p className="text-ambar text-xs font-semibold uppercase tracking-wider">Nuevo viaje</p>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-gris text-[10px] mb-1">Origen</label>
          <select
            name="origen"
            value={origen}
            onChange={e => handleOrigenChange(e.target.value as Parada)}
            className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-ambar"
          >
            {ORIGENES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-gris text-[10px] mb-1">Destino</label>
          <select
            name="destino"
            value={destino}
            onChange={e => setDestino(e.target.value as Parada)}
            className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-ambar"
          >
            {destinosPara(origen).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-gris text-[10px] mb-1">Fecha y hora de salida</label>
        <input
          type="datetime-local"
          name="fecha_hora"
          required
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-ambar"
        />
      </div>

      <div>
        <label className="block text-gris text-[10px] mb-1">Plazas disponibles</label>
        <input
          type="number"
          name="plazas"
          min="1"
          max="4"
          defaultValue="4"
          className="w-20 bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-ambar"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="flex-1 border border-linea text-gris rounded-xl py-2.5 text-[13px] font-semibold active:scale-[.98] transition-transform"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 bg-ambar text-noche font-bold rounded-xl py-2.5 text-[13px] active:scale-[.98] transition-transform"
        >
          Publicar
        </button>
      </div>
    </form>
  );
}
