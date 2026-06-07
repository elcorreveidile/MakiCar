import Link from 'next/link';
import { headers } from 'next/headers';
import MakiCarLogo from '@/components/MakiCarLogo';

const TRAMPAS: Record<string, { emoji: string; titulo: string; texto: React.ReactNode }> = {
  env: {
    emoji: '🔑',
    titulo: 'Aquí no se guardan llaves bajo la alfombrilla',
    texto: (
      <>Buscabas un <code className="text-ambar">.env</code>, pero las variables de entorno
      de MakiCar viajan en su propio vehículo, bien cerradas. Aquí solo hay rutas y horarios.</>
    ),
  },
  wordpress: {
    emoji: '🚌',
    titulo: 'Te has confundido de garaje',
    texto: (
      <>No hay <code className="text-ambar">/wp-admin</code> ni plugins por aquí — MakiCar
      no es WordPress. Solo plazas libres y buenas conexiones entre Granada y Algeciras.</>
    ),
  },
  git: {
    emoji: '🗺️',
    titulo: 'El código no viaja suelto en el maletero',
    texto: (
      <>Nuestro repositorio va guardado en GitHub, no en una carpeta{' '}
      <code className="text-ambar">.git</code> abierta al público. Aquí no hay nada que clonar.</>
    ),
  },
  php: {
    emoji: '💾',
    titulo: 'Este vehículo no lleva motor de PHP',
    texto: (
      <>Ni <code className="text-ambar">phpMyAdmin</code>, ni bases de datos sueltas por
      el maletero: MakiCar corre sobre Next.js. Sigue buscando — aquí no hay nada de eso.</>
    ),
  },
  secretos: {
    emoji: '🕵️',
    titulo: 'Aquí no hay tesoros enterrados',
    texto: (
      <>Ni claves SSH, ni copias de seguridad, ni credenciales escondidas.
      Solo rutas, horarios y buen ambiente.</>
    ),
  },
};

const TRAMPA_GENERICA = {
  emoji: '🧭',
  titulo: 'Esta parada no existe',
  texto: (
    <>Te has bajado en una ruta que no está en nuestro mapa. Ni <code className="text-ambar">.env</code>,
    ni <code className="text-ambar">/wp-admin</code>, ni tesoros ocultos por aquí — solo cinco paradas:
    Granada, Málaga, Marbella, Estepona y Algeciras.</>
  ),
};

export default async function NotFound() {
  const h = await headers();
  const trampa = TRAMPAS[h.get('x-trampa') ?? ''] ?? TRAMPA_GENERICA;

  return (
    <div className="min-h-screen bg-noche flex flex-col items-center justify-center px-6 text-center gap-5">
      <MakiCarLogo />
      <div className="text-6xl">{trampa.emoji}</div>
      <h1 className="font-fraunces text-2xl font-semibold">{trampa.titulo}</h1>
      <p className="text-gris text-sm leading-relaxed max-w-xs">{trampa.texto}</p>
      <Link
        href="/"
        className="inline-block bg-ambar text-noche font-bold rounded-xl px-6 py-3.5 text-sm active:scale-[.98] transition-transform"
      >
        Volver a la ruta principal
      </Link>
    </div>
  );
}
