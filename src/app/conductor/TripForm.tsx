'use client';
import { useState, useMemo } from 'react';
import { PARADAS, calcularPrecio, rutaDisponible } from '@/lib/tarifas';
import type { Parada } from '@/lib/tarifas';
import { crearViaje } from './actions';

const ORIGENES = PARADAS as unknown as Parada[];

function destinosPara(origen: Parada): Parada[] {
  return (PARADAS as unknown as Parada[]).filter(p => p !== origen && rutaDisponible(origen, p));
}

function PuntosInput({ name, label }: { name: string; label: string }) {
  const [puntos, setPuntos] = useState(['']);

  function update(i: number, v: string) {
    setPuntos(p => p.map((x, j) => j === i ? v : x));
  }
  function add() { setPuntos(p => [...p, '']); }
  function remove(i: number) { setPuntos(p => p.filter((_, j) => j !== i)); }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-gris text-[10px]">{label}</label>
        <button type="button" onClick={add} className="text-ambar text-[11px] font-semibold">+ Añadir</button>
      </div>
      <div className="flex flex-col gap-1.5">
        {puntos.map((p, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              type="text"
              name={name}
              value={p}
              onChange={e => update(i, e.target.value)}
              placeholder="Ej: Plaza Nueva, junto al quiosco"
              className="flex-1 bg-[#0D1117] border border-linea rounded-xl px-3 py-2 text-blanco text-sm focus:outline-none focus:border-ambar"
            />
            {puntos.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-gris text-[16px] px-2 leading-none"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TripForm() {
  const [origen,   setOrigen]   = useState<Parada>('Granada');
  const [destino,  setDestino]  = useState<Parada>('Málaga');
  const [fechaHora, setFechaHora] = useState('');
  const [abierto,  setAbierto]  = useState(false);

  function handleOrigenChange(v: Parada) {
    setOrigen(v);
    const ds = destinosPara(v);
    if (!ds.includes(destino)) setDestino(ds[0]);
  }

  // Precio sugerido según la tarifa estándar del tramo y la hora
  const precioSugerido = useMemo(() => {
    if (!fechaHora) return '';
    try {
      const r = calcularPrecio({ origen, destino, fechaHora: new Date(fechaHora), maleta: 'no', mascota: 'no' });
      return String(r.precioBase);
    } catch {
      return '';
    }
  }, [origen, destino, fechaHora]);

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
          value={fechaHora}
          onChange={e => setFechaHora(e.target.value)}
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-ambar"
        />
      </div>

      <div className="flex gap-3">
        <div>
          <label className="block text-gris text-[10px] mb-1">Plazas</label>
          <input
            type="number"
            name="plazas"
            min="1"
            max="4"
            defaultValue="4"
            className="w-20 bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-ambar"
          />
        </div>
        <div className="flex-1">
          <label className="block text-gris text-[10px] mb-1">
            Precio por plaza (€)
            {precioSugerido && <span className="ml-1 text-ambar">· tarifa {precioSugerido} €</span>}
          </label>
          <input
            type="number"
            name="precio"
            min="0"
            step="0.5"
            required
            value={precioSugerido}
            onChange={() => {}}
            placeholder="0"
            className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-ambar"
          />
        </div>
      </div>

      <PuntosInput name="puntos_recogida" label="Puntos de recogida (opcional)" />
      <PuntosInput name="puntos_llegada"  label="Puntos de llegada (opcional)" />

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
