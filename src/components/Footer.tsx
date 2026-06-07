import Link from 'next/link';

export default function Footer() {
  return (
    <p className="text-center text-[10px] text-gris opacity-40 py-3 pb-5">
      v1.0 · Desarrollado por{' '}
      <Link href="https://www.por2duros.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-1">
        Por 2 duros
      </Link>
    </p>
  );
}
