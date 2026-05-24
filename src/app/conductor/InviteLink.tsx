'use client';
import { useState } from 'react';

export default function InviteLink({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <div className="bg-carta border border-linea rounded-xl p-4 mb-3">
      <p className="text-gris text-xs uppercase tracking-wider mb-2">Tu enlace de invitación</p>
      <p className="text-blanco text-[11px] font-mono break-all mb-3 leading-relaxed opacity-70">{url}</p>
      <button
        onClick={copiar}
        className="w-full bg-violeta text-blanco text-[13px] font-bold rounded-lg py-2.5 active:scale-[.98] transition-transform"
      >
        {copiado ? '✓ ¡Copiado!' : 'Copiar enlace para WhatsApp'}
      </button>
    </div>
  );
}
