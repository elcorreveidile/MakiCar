import Link from 'next/link';
import MakiCarLogo from '@/components/MakiCarLogo';
import { enviarConsulta } from './actions';

export default async function ContactoPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string; error?: string }>;
}) {
  const params = await searchParams;
  const enviado = params.enviado === '1';
  const error = params.error;

  return (
    <div className="min-h-screen bg-noche flex flex-col">
      <div className="bg-[#0D1117] border-b border-linea px-5 pt-10 pb-4 flex items-center gap-3">
        <MakiCarLogo />
      </div>

      <div className="flex-1 px-5 py-8 max-w-lg mx-auto w-full">
        <Link href="/conductores" className="text-gris text-xs mb-6 block">← Volver</Link>

        <h1 className="font-fraunces text-[26px] font-semibold mb-1">Contacta con nosotros</h1>
        <p className="text-gris text-[13px] mb-8">
          Cuéntanos tu situación y te respondemos en menos de 24 h.
        </p>

        {enviado ? (
          <div className="bg-carta border border-linea rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">✉️</div>
            <h2 className="font-fraunces text-xl mb-2">Mensaje enviado</h2>
            <p className="text-gris text-sm leading-relaxed mb-5">
              Hemos recibido tu consulta. Te responderemos en menos de 24 h.
            </p>
            <Link
              href="/conductores"
              className="inline-block text-ambar text-sm underline underline-offset-2"
            >
              Volver a la página de inicio
            </Link>
          </div>
        ) : (
          <form action={enviarConsulta} className="flex flex-col gap-4">
            {error && (
              <p className="text-red-400 text-xs text-center bg-[rgba(229,84,75,.1)] border border-[rgba(229,84,75,.2)] rounded-xl px-4 py-3">
                {error === 'campos'  && 'Por favor, rellena nombre, email y mensaje.'}
                {error === 'envio'   && 'No se pudo enviar el mensaje. Inténtalo de nuevo.'}
                {error === 'config'  && 'Error de configuración del servidor. Contacta directamente a informa@blablaele.com.'}
              </p>
            )}

            <div>
              <label className="block text-gris text-xs mb-1.5">Nombre *</label>
              <input
                name="nombre"
                type="text"
                required
                placeholder="Tu nombre"
                className="w-full bg-[#0D1117] border border-linea rounded-xl px-4 py-3.5 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar transition-colors"
              />
            </div>

            <div>
              <label className="block text-gris text-xs mb-1.5">Email *</label>
              <input
                name="email"
                type="email"
                required
                placeholder="tu@email.com"
                className="w-full bg-[#0D1117] border border-linea rounded-xl px-4 py-3.5 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar transition-colors"
              />
            </div>

            <div>
              <label className="block text-gris text-xs mb-1.5">Teléfono <span className="text-gris">(opcional)</span></label>
              <input
                name="telefono"
                type="tel"
                placeholder="+34 600 000 000"
                className="w-full bg-[#0D1117] border border-linea rounded-xl px-4 py-3.5 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar transition-colors"
              />
            </div>

            <div>
              <label className="block text-gris text-xs mb-1.5">Mensaje *</label>
              <textarea
                name="mensaje"
                required
                rows={4}
                placeholder="Cuéntanos tu ruta, cuántos pasajeros llevas habitualmente…"
                className="w-full bg-[#0D1117] border border-linea rounded-xl px-4 py-3.5 text-blanco text-sm placeholder-gris focus:outline-none focus:border-ambar transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-ambar text-noche font-bold rounded-xl py-4 text-sm active:scale-[.98] transition-transform mt-1"
            >
              Enviar consulta
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
