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
