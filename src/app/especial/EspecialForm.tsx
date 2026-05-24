'use client';
import { useState } from 'react';
import DateTimePicker from '@/components/DateTimePicker';
import { crearSolicitudEspecial } from './actions';

export default function EspecialForm() {
  const hoy = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState('');
  const [hora, setHora]   = useState('10:00');

  return (
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
        <DateTimePicker
          fecha={fecha}
          hora={hora}
          minFecha={hoy}
          onFecha={setFecha}
          onHora={setHora}
        />
        <input type="hidden" name="fecha" value={fecha} />
        <input type="hidden" name="hora"  value={hora} />
      </div>

      <div>
        <label className="block text-gris text-xs mb-1.5">Pasajeros</label>
        <select
          name="pasajeros"
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm focus:outline-none focus:border-ambar"
        >
          {[1, 2, 3, 4].map(n => (
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
  );
}
