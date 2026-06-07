'use client';
import { useState } from 'react';

type Pasajero = {
  id: string;
  nombre: string;
  telefono: string | null;
  avatar_url: string | null;
  direccion_habitual_recogida: string | null;
  haReservado: boolean;
};

export default function PassengerList({ pasajeros }: { pasajeros: Pasajero[] }) {
  const [busqueda, setBusqueda] = useState('');

  const texto = busqueda.trim().toLowerCase();
  const filtrados = texto
    ? pasajeros.filter(p => p.nombre.toLowerCase().includes(texto))
    : pasajeros;

  return (
    <div>
      {pasajeros.length > 5 && (
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar pasajero por nombre…"
          className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar mb-3"
        />
      )}

      {filtrados.length === 0 ? (
        <p className="text-gris text-[13px] text-center py-4">Ningún pasajero coincide con &ldquo;{busqueda}&rdquo;.</p>
      ) : (
        filtrados.map(p => (
          <div key={p.id} className="bg-carta border border-linea rounded-xl p-4 mb-3 flex gap-3 items-center">
            <div className="w-12 h-12 rounded-full bg-[#0D1117] border border-linea overflow-hidden flex-shrink-0 flex items-center justify-center">
              {p.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-gris text-2xl">◎</span>
              }
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-[14px] truncate">{p.nombre}</p>
                {p.haReservado ? (
                  <span className="text-ruta text-[10px] font-bold bg-[rgba(43,182,164,.14)] px-2 py-0.5 rounded-full whitespace-nowrap">Ha reservado</span>
                ) : (
                  <span className="text-gris text-[10px] font-bold bg-[rgba(138,147,166,.14)] px-2 py-0.5 rounded-full whitespace-nowrap">Sin reservas aún</span>
                )}
              </div>
              {p.telefono && (
                <a href={`tel:${p.telefono}`} className="text-ambar text-[12px] block">
                  {p.telefono}
                </a>
              )}
              {p.direccion_habitual_recogida && (
                <p className="text-gris text-[11px] truncate">{p.direccion_habitual_recogida}</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
