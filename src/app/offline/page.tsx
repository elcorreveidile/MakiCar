import Link from 'next/link';
import MakiCarLogo from '@/components/MakiCarLogo';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-noche flex flex-col items-center justify-center px-5 text-center">
      <div className="mb-8">
        <MakiCarLogo />
      </div>
      <div className="text-5xl mb-6">📡</div>
      <h1 className="font-fraunces text-[24px] font-semibold mb-2">Sin conexión</h1>
      <p className="text-gris text-[14px] leading-relaxed mb-8 max-w-xs">
        Parece que no tienes conexión a internet. Conéctate y vuelve a intentarlo.
      </p>
      <Link
        href="/"
        className="bg-ambar text-noche font-bold rounded-xl px-6 py-3.5 text-[14px] active:scale-[.98] transition-transform"
      >
        Reintentar
      </Link>
    </div>
  );
}
