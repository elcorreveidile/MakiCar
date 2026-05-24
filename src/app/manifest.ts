import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MakiCar',
    short_name: 'MakiCar',
    description: 'Reserva tu plaza · Granada · Málaga · Marbella · Estepona · Algeciras',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0A0E1A',
    theme_color: '#FFB627',
    icons: [
      { src: '/icon?size=192', sizes: '192x192', type: 'image/png' },
      { src: '/icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...({ offline_url: '/offline' } as any),
  };
}
