'use client';
import { useState } from 'react';

export default function InviteLink({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  const mensajeWa = `¡Hola! Te invito a reservar plaza en MakiCar 🚗\nEntra con tu email en este enlace y empieza a reservar:\n${url}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(mensajeWa)}`;

  return (
    <div className="bg-carta border border-linea rounded-xl p-4 mb-3">
      <p className="text-gris text-xs uppercase tracking-wider mb-2">Tu enlace de invitación</p>
      <p className="text-blanco text-[11px] font-mono break-all mb-3 leading-relaxed opacity-70">{url}</p>
      <div className="flex flex-col gap-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#25D366] text-white text-[13px] font-bold rounded-lg py-2.5 text-center active:scale-[.98] transition-transform block"
        >
          Enviar por WhatsApp
        </a>
        <button
          onClick={copiar}
          className="w-full border border-linea text-gris text-[12px] font-semibold rounded-lg py-2 active:scale-[.98] transition-transform"
        >
          {copiado ? '✓ ¡Copiado!' : 'Copiar enlace'}
        </button>
      </div>
    </div>
  );
}
