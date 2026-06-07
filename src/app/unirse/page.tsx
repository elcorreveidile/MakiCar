import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { unirseConConductor } from './actions';

export default async function UnirsePage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; enviado?: string; error?: string }>;
}) {
  const params = await searchParams;
  const conductorId = params.c;
  const enviado = params.enviado === '1';
  const error = params.error;

  if (!conductorId) redirect('/login');

  const admin = createAdminClient();
  const { data: conductor } = await admin
    .from('conductores')
    .select('id, nombre_servicio, activo')
    .eq('id', conductorId)
    .eq('activo', true)
    .single();

  if (!conductor) redirect('/login');

  return (
    <div className="min-h-screen bg-noche flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="flex justify-center mb-4">
            <svg width="64" height="64" viewBox="0 0 92 92" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="92" height="92" rx="20" fill="#0A0E1A" stroke="#232C3F"/>
              <path d="M20 66 L20 30 L46 56 L72 30 L72 66" stroke="#FFB627" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="20" cy="30" r="6.5" fill="#0A0E1A" stroke="#FFB627" strokeWidth="4"/>
              <circle cx="72" cy="30" r="6.5" fill="#0A0E1A" stroke="#FFB627" strokeWidth="4"/>
              <circle cx="46" cy="56" r="5" fill="#2BB6A4"/>
            </svg>
          </Link>
          <h1 className="font-fraunces text-4xl font-semibold">
            Maki<span className="text-ambar">Car</span>
          </h1>
          <p className="text-gris text-sm mt-2">Granada · Málaga · Marbella · Estepona · Algeciras</p>
        </div>

        {enviado ? (
          <div className="bg-carta border border-linea rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="font-fraunces text-xl mb-2">Revisa tu email</h2>
            <p className="text-gris text-sm leading-relaxed">
              Te hemos enviado un enlace de acceso. Púlsalo para entrar y empezar a reservar.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-carta border border-linea rounded-xl p-4 mb-6 text-center">
              <p className="text-gris text-xs uppercase tracking-wider mb-1">Tu conductor</p>
              <p className="font-fraunces text-2xl text-blanco">{conductor.nombre_servicio}</p>
              <p className="text-gris text-xs mt-1">te invita a reservar plaza en MakiCar</p>
            </div>

            <form action={unirseConConductor} className="flex flex-col gap-4">
              <input type="hidden" name="conductor_id" value={conductorId} />
              <div>
                <label className="block text-gris text-xs mb-1.5">Tu email</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  className="w-full bg-[#0D1117] border border-linea rounded-xl px-4 py-3.5 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar transition-colors"
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs text-center">
                  No se pudo enviar el email. Inténtalo de nuevo.
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-ambar text-noche font-bold rounded-xl py-4 text-sm active:scale-[.98] transition-transform"
              >
                Acceder con enlace de email
              </button>
            </form>

            <p className="text-gris text-[11px] text-center mt-6 leading-relaxed">
              🚭 Prohibido fumar · 🐾 Se admiten mascotas avisando
            </p>
          </>
        )}
      </div>
    </div>
  );
}
