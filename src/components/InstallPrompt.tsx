'use client';
import { useEffect, useState } from 'react';

type InstallState = 'hidden' | 'android' | 'ios';

export default function InstallPrompt() {
  const [state, setState] = useState<InstallState>('hidden');
  const [prompt, setPrompt] = useState<Event & { prompt?: () => void } | null>(null);

  useEffect(() => {
    // Already installed as PWA — hide the banner
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;

    if (isIOS) {
      setState('ios');
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      setState('android');
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  async function instalar() {
    if (!prompt || !('prompt' in prompt)) return;
    prompt.prompt?.();
    setState('hidden');
  }

  if (state === 'hidden') return null;

  return (
    <div className="mx-5 mb-4 bg-carta border border-linea rounded-xl p-4 flex items-start gap-3">
      <span className="text-[22px] mt-0.5">📲</span>
      <div className="flex-1">
        <p className="font-semibold text-[13px] mb-0.5">Añadir a pantalla de inicio</p>
        {state === 'android' ? (
          <>
            <p className="text-gris text-[12px] mb-3">Instala MakiCar como app y ábrela sin navegador.</p>
            <button
              onClick={instalar}
              className="bg-ambar text-noche text-[13px] font-bold rounded-lg px-4 py-2 active:scale-[.98] transition-transform"
            >
              Instalar app
            </button>
          </>
        ) : (
          <p className="text-gris text-[12px] leading-relaxed">
            Pulsa el botón <strong className="text-blanco">Compartir</strong> de Safari y luego{' '}
            <strong className="text-blanco">"Añadir a pantalla de inicio"</strong>.
          </p>
        )}
      </div>
      <button
        onClick={() => setState('hidden')}
        className="text-gris text-[18px] leading-none mt-0.5 px-1"
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  );
}
