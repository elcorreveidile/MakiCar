'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cerrarViaje, reabrirViaje, editarViaje, eliminarViaje } from './actions';
import type { EstadoTrip } from '@/lib/supabase/types';

interface Trip {
  id: string;
  origen_cabecera: string;
  destino_cabecera: string;
  fecha_hora: string;
  plazas_totales: number;
  plazas_libres: number;
  precio: number;
  estado: EstadoTrip;
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function toLocalDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TripCard({ trip }: { trip: Trip }) {
  const [editando, setEditando] = useState(false);
  const router = useRouter();

  if (editando) {
    return (
      <div className="bg-carta border border-ambar/30 rounded-xl p-4 mb-3">
        <form
          action={async (fd) => { await editarViaje(fd); setEditando(false); router.refresh(); }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="trip_id" value={trip.id} />
          <p className="text-ambar text-xs font-semibold uppercase tracking-wider">
            Editar · {trip.origen_cabecera} → {trip.destino_cabecera}
          </p>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-gris text-[10px] mb-1">Fecha</label>
              <input
                type="date"
                name="fecha"
                defaultValue={toLocalDate(trip.fecha_hora)}
                required
                className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-ambar"
              />
            </div>
            <div>
              <label className="block text-gris text-[10px] mb-1">Hora</label>
              <input
                type="time"
                name="hora"
                defaultValue={toLocalTime(trip.fecha_hora)}
                required
                className="w-28 bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-ambar"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div>
              <label className="block text-gris text-[10px] mb-1">Plazas totales</label>
              <input
                type="number"
                name="plazas"
                min="1"
                max="4"
                defaultValue={trip.plazas_totales}
                className="w-20 bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-ambar"
              />
            </div>
            <div className="flex-1">
              <label className="block text-gris text-[10px] mb-1">Precio/plaza (€)</label>
              <input
                type="number"
                name="precio"
                min="0"
                step="0.5"
                defaultValue={trip.precio}
                required
                className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm focus:outline-none focus:border-ambar"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="flex-1 border border-linea text-gris rounded-xl py-2.5 text-[13px] font-semibold active:scale-[.98] transition-transform"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-ambar text-noche font-bold rounded-xl py-2.5 text-[13px] active:scale-[.98] transition-transform"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-carta border border-linea rounded-xl p-4 mb-3">
      <div className="flex justify-between items-start mb-1">
        <span className="font-semibold text-[14px]">
          {trip.origen_cabecera} → {trip.destino_cabecera}
        </span>
        {trip.estado === 'abierto'
          ? <span className="text-ruta text-[10px] font-bold bg-[rgba(43,182,164,.14)] px-2 py-0.5 rounded-full">ABIERTO</span>
          : <span className="text-gris text-[10px] font-bold bg-[rgba(138,147,166,.14)] px-2 py-0.5 rounded-full">CERRADO</span>
        }
      </div>
      <div className="text-gris text-[12px] mb-3">
        {formatFecha(trip.fecha_hora)} · {trip.plazas_libres}/{trip.plazas_totales} plazas · {trip.precio} €/plaza
      </div>

      <div className="flex gap-2">
        {trip.estado === 'abierto' ? (
          <form action={cerrarViaje} className="flex-1">
            <input type="hidden" name="trip_id" value={trip.id} />
            <button type="submit" className="w-full text-[12px] text-gris border border-linea rounded-lg px-3 py-1.5 font-semibold active:scale-[.98] transition-transform">
              Cerrar
            </button>
          </form>
        ) : (
          <form action={reabrirViaje} className="flex-1">
            <input type="hidden" name="trip_id" value={trip.id} />
            <button type="submit" className="w-full text-[12px] text-ambar border border-ambar/40 rounded-lg px-3 py-1.5 font-semibold active:scale-[.98] transition-transform">
              Reabrir
            </button>
          </form>
        )}
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="flex-1 text-[12px] text-gris border border-linea rounded-lg px-3 py-1.5 font-semibold active:scale-[.98] transition-transform"
        >
          Editar
        </button>
        <form action={eliminarViaje}>
          <input type="hidden" name="trip_id" value={trip.id} />
          <button
            type="submit"
            className="text-[12px] text-[#E5544B] border border-[rgba(229,84,75,.4)] rounded-lg px-3 py-1.5 font-semibold active:scale-[.98] transition-transform"
          >
            Eliminar
          </button>
        </form>
      </div>
    </div>
  );
}
