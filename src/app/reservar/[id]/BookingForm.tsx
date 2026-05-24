'use client';
import { useState, useMemo } from 'react';
import { PARADAS, calcularPrecio, rutaDisponible } from '@/lib/tarifas';
import type { Parada } from '@/lib/tarifas';
import { reservarEnViaje } from './actions';

interface Trip {
  id: string;
  origen: string;
  destino: string;
  fechaHora: string;
}

function paradasDisponibles(origen: string, destino: string): Parada[] {
  const idxOrigen  = PARADAS.indexOf(origen  as Parada);
  const idxDestino = PARADAS.indexOf(destino as Parada);
  if (idxOrigen === -1 || idxDestino === -1) return [destino as Parada];

  const lista = idxOrigen < idxDestino
    ? (PARADAS.slice(idxOrigen + 1, idxDestino + 1) as unknown as Parada[])
    : [...(PARADAS.slice(idxDestino, idxOrigen) as unknown as Parada[])].reverse();

  return lista.filter(p => rutaDisponible(origen as Parada, p));
}

export default function BookingForm({ trip }: { trip: Trip }) {
  const paradas = useMemo(
    () => paradasDisponibles(trip.origen, trip.destino),
    [trip.origen, trip.destino]
  );

  const [destinoPasajero, setDestinoPasajero] = useState<Parada>(
    paradas[paradas.length - 1] ?? (trip.destino as Parada)
  );
  const [maleta,  setMaleta]  = useState('no');
  const [mascota, setMascota] = useState('no');

  const precioBase = useMemo(() => {
    try {
      return calcularPrecio({
        origen:    trip.origen as Parada,
        destino:   destinoPasajero,
        fechaHora: new Date(trip.fechaHora),
        maleta:    'no',
        mascota:   'no',
      }).precioBase;
    } catch {
      return 0;
    }
  }, [trip.origen, destinoPasajero, trip.fechaHora]);

  let suplementos = 0;
  if (maleta  === 'maletero') suplementos += 5;
  else if (maleta  === 'asiento') suplementos += precioBase;
  if (mascota === 'pies')    suplementos += 5;
  else if (mascota === 'asiento') suplementos += precioBase;
  const total = precioBase + suplementos;

  return (
    <form action={reservarEnViaje} className="flex flex-col gap-3.5">
      <input type="hidden" name="trip_id"          value={trip.id} />
      <input type="hidden" name="destino_pasajero" value={destinoPasajero} />

      {/* Parada de bajada — solo se muestra si hay más de una opción */}
      {paradas.length > 1 && (
        <div>
          <label className="block text-gris text-xs mb-1.5">Parada de bajada</label>
          <select
            value={destinoPasajero}
            onChange={e => setDestinoPasajero(e.target.value as Parada)}
            className="w-full bg-[#0D1117] border border-linea rounded-xl px-3.5 py-3 text-blanco text-sm focus:outline-none focus:border-ambar"
          >
            {paradas.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      )}

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
          placeholder={`Ej: Av. del Mar 12, ${destinoPasajero}`}
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
          <span>{trip.origen} → {destinoPasajero}</span>
          <span className="text-blanco">{precioBase} €</span>
        </div>
        {maleta === 'maletero' && (
          <div className="flex justify-between text-[13px] py-1 text-gris">
            <span>Maleta (maletero)</span><span className="text-blanco">+5 €</span>
          </div>
        )}
        {maleta === 'asiento' && (
          <div className="flex justify-between text-[13px] py-1 text-gris">
            <span>Maleta (plaza completa)</span><span className="text-blanco">+{precioBase} €</span>
          </div>
        )}
        {mascota === 'pies' && (
          <div className="flex justify-between text-[13px] py-1 text-gris">
            <span>Mascota (a los pies)</span><span className="text-blanco">+5 €</span>
          </div>
        )}
        {mascota === 'asiento' && (
          <div className="flex justify-between text-[13px] py-1 text-gris">
            <span>Mascota (plaza completa)</span><span className="text-blanco">+{precioBase} €</span>
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
