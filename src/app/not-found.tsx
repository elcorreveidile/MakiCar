import Link from 'next/link';
import MakiCarLogo from '@/components/MakiCarLogo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-noche flex flex-col items-center justify-center px-6 text-center gap-5">
      <MakiCarLogo />
      <div className="text-6xl">🧭</div>
      <h1 className="font-fraunces text-2xl font-semibold">Esta parada no existe</h1>
      <p className="text-gris text-sm leading-relaxed max-w-xs">
        Te has bajado en una ruta que no está en nuestro mapa. Ni <code className="text-ambar">.env</code>,
        ni <code className="text-ambar">/wp-admin</code>, ni tesoros ocultos por aquí — solo cinco paradas:
        Granada, Málaga, Marbella, Estepona y Algeciras.
      </p>
      <Link
        href="/"
        className="inline-block bg-ambar text-noche font-bold rounded-xl px-6 py-3.5 text-sm active:scale-[.98] transition-transform"
      >
        Volver a la ruta principal
      </Link>
    </div>
  );
}
