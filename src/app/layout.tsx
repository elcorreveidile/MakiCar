import type { Metadata } from 'next';
import { Fraunces, Sora } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MakiCar',
  description: 'Reserva tu plaza · Granada · Málaga · Marbella · Estepona · Algeciras',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${sora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
