import Link from 'next/link';

export default function Footer() {
  return (
    <p className="text-center text-[10px] text-gris opacity-40 py-3 pb-5">
      v1.0 · Desarrollado por{' '}
      <Link href="https://espanias.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-1">
        espanias.com
      </Link>
    </p>
  );
}
