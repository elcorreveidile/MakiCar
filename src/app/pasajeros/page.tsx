import Link from 'next/link';
import MakiCarLogo from '@/components/MakiCarLogo';
import Footer from '@/components/Footer';

const PASOS = [
  {
    num: '01',
    title: 'Tu conductor te invita',
    desc: 'Recibes un enlace único por WhatsApp. Lo abres, introduces tu email y listo — quedas vinculado a tu conductor sin necesidad de descargar nada.',
  },
  {
    num: '02',
    title: 'Reservas cuando quieras',
    desc: 'Consulta los próximos viajes disponibles, elige tu parada de bajada y reserva tu plaza en menos de un minuto. La app calcula el precio automáticamente.',
  },
  {
    num: '03',
    title: 'El conductor confirma',
    desc: 'Tu reserva queda pendiente hasta que el conductor la acepta. Recibes un aviso por email en cuanto esté confirmada.',
  },
  {
    num: '04',
    title: 'Viajas y pagas',
    desc: 'Paga en efectivo o con tarjeta, como prefieras. El dinero va directamente al conductor, sin comisiones de plataforma que inflen el precio.',
  },
];

const VENTAJAS = [
  {
    icon: '🚗',
    title: 'Siempre el mismo conductor',
    desc: 'No es un coche aleatorio. Es tu conductor habitual — conoce tu parada, tus horarios y cómo prefieres viajar.',
  },
  {
    icon: '📍',
    title: 'Parada a tu medida',
    desc: 'El viaje cubre toda la ruta, pero tú eliges dónde bajas. Solo pagas el tramo que realmente haces.',
  },
  {
    icon: '🐾',
    title: 'Mascotas bienvenidas',
    desc: 'Puedes viajar con tu mascota avisando al reservar. Sin sorpresas, sin rechazos de último momento.',
  },
  {
    icon: '⚡',
    title: 'Sin apps de tienda',
    desc: 'MakiCar funciona desde el navegador de tu móvil. Puedes añadirla a la pantalla de inicio como cualquier app, sin pasar por ninguna tienda.',
  },
  {
    icon: '🔒',
    title: 'Reservas con garantía',
    desc: 'Tu plaza queda reservada en cuanto el conductor confirma. Y si necesitas cancelar con más de 24 h de antelación, sin coste.',
  },
  {
    icon: '🛣️',
    title: 'Servicios especiales',
    desc: 'Aeropuerto, horario distinto, grupo de amigos. Si lo necesitas, solicita un servicio especial y el conductor te hace un precio.',
  },
];

export default function PasajerosPage() {
  return (
    <div className="min-h-screen bg-noche flex flex-col">
      {/* Header */}
      <div className="bg-[#0D1117] border-b border-linea px-5 pt-10 pb-4 flex items-center">
        <MakiCarLogo />
      </div>

      <div className="flex-1 px-5 py-8 max-w-lg mx-auto w-full">

        {/* Hero */}
        <h1 className="font-fraunces text-[28px] font-semibold leading-tight mb-2">
          Viaja mejor.<br />
          <span className="text-ambar">Con quien ya conoces.</span>
        </h1>
        <p className="text-gris text-[14px] leading-relaxed mb-10">
          MakiCar no es un taxi ni un autobús. Es un servicio de transporte compartido con un conductor de confianza,
          en la ruta Granada · Málaga · Marbella · Estepona · Algeciras.
        </p>

        {/* Cómo funciona */}
        <p className="text-gris text-xs uppercase tracking-widest mb-4">Cómo funciona</p>
        <div className="flex flex-col gap-4 mb-10">
          {PASOS.map((p) => (
            <div key={p.num} className="flex gap-4 items-start">
              <span className="font-fraunces text-ambar text-[22px] font-semibold leading-none mt-0.5 w-7 shrink-0">{p.num}</span>
              <div>
                <p className="font-semibold text-[13px] mb-0.5">{p.title}</p>
                <p className="text-gris text-[12px] leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Narrative */}
        <div className="border-l-2 border-ruta pl-4 mb-10">
          <p className="font-fraunces text-[17px] font-semibold mb-2 leading-snug">
            El conductor que te conoce
          </p>
          <p className="text-gris text-[13px] leading-relaxed">
            Cuando viajas con frecuencia, la relación con tu conductor vale mucho. Sabe que bajas en Marbella,
            que los viernes llevas maleta, que prefieres no hablar demasiado por la mañana.
            MakiCar formaliza esa relación: reservas, historial y pagos en orden, sin renunciar a ese trato cercano
            que no encontrarás en ninguna gran plataforma.
          </p>
        </div>

        {/* Ventajas */}
        <p className="text-gris text-xs uppercase tracking-widest mb-4">Por qué MakiCar</p>
        <div className="flex flex-col gap-3 mb-10">
          {VENTAJAS.map((v) => (
            <div key={v.title} className="bg-carta border border-linea rounded-xl p-4 flex gap-3 items-start">
              <span className="text-[20px] mt-0.5">{v.icon}</span>
              <div>
                <p className="font-semibold text-[13px] mb-0.5">{v.title}</p>
                <p className="text-gris text-[12px] leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-carta border border-linea rounded-2xl p-5 text-center mb-6">
          <p className="font-fraunces text-[18px] font-semibold mb-1">¿Listo para reservar?</p>
          <p className="text-gris text-[13px] mb-4">
            Pide a tu conductor el enlace de invitación y empieza hoy.
          </p>
          <Link
            href="/login"
            className="block w-full bg-ambar text-noche font-bold rounded-xl py-3.5 text-[14px] text-center active:scale-[.98] transition-transform"
          >
            Entrar en MakiCar
          </Link>
        </div>

        <Link href="/conductores" className="block text-center text-gris text-xs underline underline-offset-2 pb-8">
          ¿Eres conductor? Ver tarifas →
        </Link>
      </div>
      <Footer />
    </div>
  );
}
