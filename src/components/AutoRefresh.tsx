'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const INTERVALO_MS = 60_000;

export default function AutoRefresh() {
  const router = useRouter();
  const [girando, setGirando] = useState(false);

  // Refresco automático en segundo plano cada minuto
  useEffect(() => {
    const id = setInterval(() => router.refresh(), INTERVALO_MS);
    return () => clearInterval(id);
  }, [router]);

  function refrescar() {
    setGirando(true);
    router.refresh();
    setTimeout(() => setGirando(false), 800);
  }

  return (
    <button
      onClick={refrescar}
      title="Actualizar"
      className="text-gris text-[15px] border border-linea rounded-lg px-2.5 py-1 active:scale-[.97] transition-transform leading-none"
      style={{ transition: 'transform 0.2s' }}
    >
      <span
        style={{
          display: 'inline-block',
          transition: 'transform 0.6s',
          transform: girando ? 'rotate(360deg)' : 'rotate(0deg)',
        }}
      >
        ↻
      </span>
    </button>
  );
}
