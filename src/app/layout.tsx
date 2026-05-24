import type { Metadata } from 'next';
import { Fraunces, Sora } from 'next/font/google';
import './globals.css';
import ServiceWorker from '@/components/ServiceWorker';

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
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MakiCar',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'theme-color': '#FFB627',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${sora.variable}`}>
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
