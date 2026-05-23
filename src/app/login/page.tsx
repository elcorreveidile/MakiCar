import { enviarMagicLink } from './actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string; error?: string }>;
}) {
  const params = await searchParams;
  const enviado = params.enviado === '1';
  const error = params.error;

  return (
    <div className="min-h-screen bg-noche flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <svg width="64" height="64" viewBox="0 0 92 92" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="92" height="92" rx="20" fill="#0A0E1A" stroke="#232C3F"/>
              <path d="M20 66 L20 30 L46 56 L72 30 L72 66" stroke="#FFB627" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="20" cy="30" r="6.5" fill="#0A0E1A" stroke="#FFB627" strokeWidth="4"/>
              <circle cx="72" cy="30" r="6.5" fill="#0A0E1A" stroke="#FFB627" strokeWidth="4"/>
              <circle cx="46" cy="56" r="5" fill="#2BB6A4"/>
            </svg>
          </div>
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
              Te hemos enviado un enlace de acceso. Pulsa el enlace del email para entrar.
            </p>
          </div>
        ) : (
          <form action={enviarMagicLink} className="flex flex-col gap-4">
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
                {error === 'enlace_invalido' && 'El enlace ha caducado. Pide uno nuevo.'}
                {error === 'envio_fallido' && 'No se pudo enviar el email. Inténtalo de nuevo.'}
                {error === 'email_requerido' && 'Introduce tu email.'}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-ambar text-noche font-bold rounded-xl py-4 text-sm active:scale-[.98] transition-transform"
            >
              Enviar enlace de acceso
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
