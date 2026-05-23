'use client';
import { useState } from 'react';
import { reservarEnViaje } from './actions';

interface Trip {
  id: string;
  precio: number;
}

export default function BookingForm({ trip }: { trip: Trip }) {
  const [maleta,  setMaleta]  = useState('no');
  const [mascota, setMascota] = useState('no');

  const base = trip.precio;
  let suplementos = 0;
  if (maleta  === 'maletero') suplementos += 5;
  else if (maleta  === 'asiento') suplementos += base;
  if (mascota === 'pies')    suplementos += 5;
  else if (mascota === 'asiento') suplementos += base;
  const total = base + suplementos;

  return (
    <form action={reservarEnViaje} className="flex flex-col gap-3.5">
      <input type="hidden" name="trip_id" value={trip.id} />

      <div>
        <label className="block text-gris text-xs mb-1.5">Dirección de recogida (opcional)</label>
        <input
          name="direccion_recogida"
          type="text"
          placeholder="Ej: Calle Mayor 5, Granada"
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar"
        />
      </div>

      <div>
        <label className="block text-gris text-xs mb-1.5">Dirección de destino (opcional)</label>
        <input
          name="direccion_destino"
          type="text"
          placeholder="Ej: Hotel Miramar, Marbella"
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar"
        />
      </div>

      <div>
        <label className="block text-gris text-xs mb-1.5">Equipaje</label>
        <select
          name="maleta"
          value={maleta}
          onChange={e => setMaleta(e.target.value)}
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm focus:outline-none focus:border-ambar"
        >
          <option value="no">Sin maleta grande</option>
          <option value="maletero">Maleta en maletero (+5 €)</option>
          <option value="asiento">Maleta en asiento (plaza completa)</option>
        </select>
      </div>

      <div>
        <label className="block text-gris text-xs mb-1.5">¿Viajas con mascota? 🐾</label>
        <select
          name="mascota"
          value={mascota}
          onChange={e => setMascota(e.target.value)}
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm focus:outline-none focus:border-ambar"
        >
          <option value="no">No llevo mascota</option>
          <option value="pies">A los pies / regazo (+5 €)</option>
          <option value="asiento">Ocupa asiento (plaza completa)</option>
        </select>
      </div>

      <div>
        <label className="block text-gris text-xs mb-1.5">Forma de pago</label>
        <select
          name="forma_pago"
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm focus:outline-none focus:border-ambar"
        >
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
        </select>
      </div>

      <div className="bg-[rgba(43,182,164,.08)] border border-[rgba(43,182,164,.25)] text-[#9fe7dc] text-xs rounded-xl px-3.5 py-3 leading-relaxed">
        🚭 Prohibido fumar &nbsp;·&nbsp; 🐾 Se admiten mascotas (avisando antes)
      </div>

      {/* Resumen de precio */}
      <div className="bg-carta border border-linea rounded-xl p-4">
        <div className="flex justify-between text-[13px] py-1 text-gris">
          <span>Precio por plaza</span>
          <span className="text-blanco">{base} €</span>
        </div>
        {maleta === 'maletero' && (
          <div className="flex justify-between text-[13px] py-1 text-gris">
            <span>Maleta (maletero)</span><span className="text-blanco">+5 €</span>
          </div>
        )}
        {maleta === 'asiento' && (
          <div className="flex justify-between text-[13px] py-1 text-gris">
            <span>Maleta (plaza completa)</span><span className="text-blanco">+{base} €</span>
          </div>
        )}
        {mascota === 'pies' && (
          <div className="flex justify-between text-[13px] py-1 text-gris">
            <span>Mascota (a los pies)</span><span className="text-blanco">+5 €</span>
          </div>
        )}
        {mascota === 'asiento' && (
          <div className="flex justify-between text-[13px] py-1 text-gris">
            <span>Mascota (plaza completa)</span><span className="text-blanco">+{base} €</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-3 mt-2 border-t border-linea">
          <span className="text-[13px] text-gris">Total a pagar al conductor</span>
          <span className="font-fraunces text-2xl text-ambar font-semibold">{total} €</span>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-ambar text-noche font-bold rounded-xl py-4 text-[15px] active:scale-[.98] transition-transform"
      >
        Solicitar reserva
      </button>
    </form>
  );
}
