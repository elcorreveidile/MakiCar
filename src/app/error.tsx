'use client';

import MakiCarLogo from '@/components/MakiCarLogo';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-noche flex flex-col items-center justify-center px-6 text-center gap-5">
      <MakiCarLogo />
      <div className="text-6xl">🚧</div>
      <h1 className="font-fraunces text-2xl font-semibold">Pinchazo técnico</h1>
      <p className="text-gris text-sm leading-relaxed max-w-xs">
        Algo se ha calado por el camino. Nuestro mecánico ya está avisado — mientras tanto,
        prueba a arrancar de nuevo.
      </p>
      <button
        onClick={() => reset()}
        className="inline-block bg-ambar text-noche font-bold rounded-xl px-6 py-3.5 text-sm active:scale-[.98] transition-transform"
      >
        Reintentar
      </button>
    </div>
  );
}
