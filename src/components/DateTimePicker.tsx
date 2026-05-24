'use client';
import { useState } from 'react';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const SEMANA = ['L','M','X','J','V','S','D'];

interface Props {
  fecha: string;   // YYYY-MM-DD
  hora: string;    // HH:MM
  minFecha?: string;
  onFecha: (v: string) => void;
  onHora: (v: string) => void;
}

export default function DateTimePicker({ fecha, hora, minFecha, onFecha, onHora }: Props) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewY, setViewY] = useState(today.getFullYear());
  const [viewM, setViewM] = useState(today.getMonth());

  const hh = parseInt(hora.split(':')[0] ?? '8', 10);
  const mm = parseInt(hora.split(':')[1] ?? '0', 10);

  function pad(n: number) { return String(n).padStart(2, '0'); }

  function prevMes() {
    if (viewM === 0) { setViewM(11); setViewY(y => y - 1); }
    else setViewM(m => m - 1);
  }
  function nextMes() {
    if (viewM === 11) { setViewM(0); setViewY(y => y + 1); }
    else setViewM(m => m + 1);
  }

  function isoDay(day: number) {
    return `${viewY}-${pad(viewM + 1)}-${pad(day)}`;
  }
  function disabled(day: number) {
    return !!minFecha && isoDay(day) < minFecha;
  }
  function selected(day: number) {
    return fecha === isoDay(day);
  }
  function isHoy(day: number) {
    return viewY === today.getFullYear() && viewM === today.getMonth() && day === today.getDate();
  }

  // Grid de días
  const totalDias = new Date(viewY, viewM + 1, 0).getDate();
  const primerDia = (() => { const d = new Date(viewY, viewM, 1).getDay(); return d === 0 ? 6 : d - 1; })();
  const celdas: (number | null)[] = [...Array(primerDia).fill(null), ...Array.from({length: totalDias}, (_, i) => i + 1)];
  while (celdas.length % 7 !== 0) celdas.push(null);

  function cambiarHora(dh: number) { onHora(`${pad((hh + dh + 24) % 24)}:${pad(mm)}`); }
  function cambiarMinuto(dm: number) { onHora(`${pad(hh)}:${pad((mm + dm + 60) % 60)}`); }

  const label = fecha
    ? `${fecha.split('-').reverse().join('/')}  ${hora}`
    : 'Seleccionar fecha y hora';

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-[#0D1117] border border-linea rounded-xl px-3 py-2.5 text-sm text-left flex justify-between items-center focus:outline-none focus:border-ambar active:scale-[.99] transition-transform"
      >
        <span className={fecha ? 'text-blanco' : 'text-gris'}>{label}</span>
        <span className="text-gris text-[18px] leading-none">📅</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Fondo */}
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="relative bg-carta border border-linea rounded-2xl p-5 w-full max-w-sm shadow-2xl">

            {/* Cabecera mes */}
            <div className="flex justify-between items-center mb-4">
              <button type="button" onClick={prevMes}
                className="w-9 h-9 flex items-center justify-center text-gris hover:text-blanco rounded-xl hover:bg-[#0D1117] transition-colors text-xl">
                ‹
              </button>
              <span className="font-semibold text-blanco text-[15px]">
                {MESES[viewM]} {viewY}
              </span>
              <button type="button" onClick={nextMes}
                className="w-9 h-9 flex items-center justify-center text-gris hover:text-blanco rounded-xl hover:bg-[#0D1117] transition-colors text-xl">
                ›
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 mb-1">
              {SEMANA.map(d => (
                <div key={d} className="text-center text-gris text-[11px] font-semibold py-1">{d}</div>
              ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7 gap-y-1 mb-5">
              {celdas.map((day, i) => (
                <div key={i} className="flex justify-center">
                  {day ? (
                    <button
                      type="button"
                      disabled={disabled(day)}
                      onClick={() => onFecha(isoDay(day))}
                      className={`w-9 h-9 rounded-xl text-[13px] font-medium transition-all
                        ${selected(day) ? 'bg-ambar text-noche font-bold' : ''}
                        ${isHoy(day) && !selected(day) ? 'border border-ambar/60 text-ambar' : ''}
                        ${disabled(day) ? 'text-[#232C3F] cursor-not-allowed' : (!selected(day) ? 'text-blanco hover:bg-[#0D1117] active:scale-95' : '')}
                      `}
                    >
                      {day}
                    </button>
                  ) : <div className="w-9 h-9" />}
                </div>
              ))}
            </div>

            {/* Selector de hora */}
            <div className="border-t border-linea pt-4 mb-5">
              <p className="text-gris text-[11px] uppercase tracking-wider mb-3 text-center">Hora de salida</p>
              <div className="flex items-center justify-center gap-4">
                {/* Horas */}
                <div className="flex flex-col items-center gap-1">
                  <button type="button" onClick={() => cambiarHora(1)}
                    className="text-gris hover:text-ambar text-[20px] leading-none transition-colors px-2">▲</button>
                  <div className="bg-[#0D1117] border border-linea rounded-xl w-16 h-12 flex items-center justify-center text-blanco font-fraunces text-[24px] font-semibold select-none">
                    {pad(hh)}
                  </div>
                  <button type="button" onClick={() => cambiarHora(-1)}
                    className="text-gris hover:text-ambar text-[20px] leading-none transition-colors px-2">▼</button>
                </div>

                <span className="text-blanco font-fraunces text-[28px] font-semibold leading-none mb-0.5">:</span>

                {/* Minutos (saltos de 5) */}
                <div className="flex flex-col items-center gap-1">
                  <button type="button" onClick={() => cambiarMinuto(5)}
                    className="text-gris hover:text-ambar text-[20px] leading-none transition-colors px-2">▲</button>
                  <div className="bg-[#0D1117] border border-linea rounded-xl w-16 h-12 flex items-center justify-center text-blanco font-fraunces text-[24px] font-semibold select-none">
                    {pad(mm)}
                  </div>
                  <button type="button" onClick={() => cambiarMinuto(-5)}
                    className="text-gris hover:text-ambar text-[20px] leading-none transition-colors px-2">▼</button>
                </div>
              </div>
            </div>

            {/* Confirmar */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={!fecha}
              className="w-full bg-ambar text-noche font-bold rounded-xl py-3 text-[14px] disabled:opacity-40 active:scale-[.98] transition-transform"
            >
              {fecha ? `Confirmar — ${fecha.split('-').reverse().join('/')} a las ${hora}` : 'Elige una fecha'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
