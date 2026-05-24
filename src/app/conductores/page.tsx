import Link from 'next/link';
import MakiCarLogo from '@/components/MakiCarLogo';

const FEATURES = [
  {
    icon: '📋',
    title: 'Panel de gestión completo',
    desc: 'Publica viajes, gestiona reservas y confirma o rechaza plazas desde tu móvil.',
  },
  {
    icon: '🔗',
    title: 'Enlace de invitación propio',
    desc: 'Comparte tu enlace único por WhatsApp y tus pasajeros quedan vinculados a ti.',
  },
  {
    icon: '💰',
    title: 'Motor de tarifas automático',
    desc: 'Precios día/noche por tramo calculados automáticamente. Tú solo publicas el viaje.',
  },
  {
    icon: '📬',
    title: 'Avisos por email',
    desc: 'Notificaciones de nuevas reservas y cancelaciones directamente en tu bandeja.',
  },
  {
    icon: '🐾',
    title: 'Suplementos integrados',
    desc: 'Maleta grande y mascotas con coste extra gestionado sin esfuerzo.',
  },
  {
    icon: '📱',
    title: 'Funciona como app',
    desc: 'Instalable en iOS y Android (PWA). Sin tiendas de apps, siempre actualizado.',
  },
  {
    icon: '🔒',
    title: 'Pasajeros vinculados a ti',
    desc: 'Cada pasajero que entra por tu enlace queda asociado exclusivamente a ti. No compites con otros conductores dentro de la app.',
  },
  {
    icon: '⚖️',
    title: 'Compromiso garantizado',
    desc: 'Las cancelaciones con menos de 24 h generan una deuda registrada en el perfil del pasajero, que se salda en el siguiente viaje. Menos no-shows, más fiabilidad.',
  },
];

export default function ConductoresPage() {
  return (
    <div className="min-h-screen bg-noche flex flex-col">
      {/* Header */}
      <div className="bg-[#0D1117] border-b border-linea px-5 pt-10 pb-4 flex items-center gap-3">
        <MakiCarLogo />
      </div>

      <div className="flex-1 px-5 py-8 max-w-lg mx-auto w-full">
        {/* Hero */}
        <h1 className="font-fraunces text-[28px] font-semibold leading-tight mb-2">
          Gestiona tus viajes con <span className="text-ambar">MakiCar</span>
        </h1>
        <p className="text-gris text-[14px] leading-relaxed mb-8">
          La plataforma pensada para conductores profesionales de trayectos regulares.
          Sin comisiones por reserva. Sin intermediarios. Tu dinero, directo.
        </p>

        {/* Pricing */}
        <div className="bg-carta border border-linea rounded-2xl p-5 mb-6">
          <p className="text-gris text-xs uppercase tracking-widest mb-4">Precio</p>

          <div className="flex gap-3 mb-4">
            {/* Monthly */}
            <div className="flex-1 bg-[#0D1117] border border-linea rounded-xl p-4 text-center">
              <p className="text-gris text-[11px] mb-1">Alta única</p>
              <p className="font-fraunces text-[28px] font-semibold text-blanco">150<span className="text-[16px]"> €</span></p>
              <p className="text-gris text-[11px] mt-1">configuración incluida</p>
            </div>
            <div className="flex-1 bg-[#0D1117] border border-linea rounded-xl p-4 text-center">
              <p className="text-gris text-[11px] mb-1">Mensual</p>
              <p className="font-fraunces text-[28px] font-semibold text-blanco">30<span className="text-[16px]"> €</span></p>
              <p className="text-gris text-[11px] mt-1">/ mes</p>
            </div>
          </div>

          {/* Annual highlight */}
          <div className="bg-[rgba(255,182,39,.08)] border border-[rgba(255,182,39,.25)] rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-ambar text-[13px] font-bold">Pago anual</p>
              <p className="text-gris text-[11px] mt-0.5">2 meses gratis frente al mensual</p>
            </div>
            <p className="font-fraunces text-[22px] font-semibold text-ambar">300 €<span className="text-[12px] text-gris font-normal"> /año</span></p>
          </div>
        </div>

        {/* Features */}
        <p className="text-gris text-xs uppercase tracking-widest mb-3">Qué incluye</p>
        <div className="flex flex-col gap-3 mb-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-carta border border-linea rounded-xl p-4 flex gap-3 items-start">
              <span className="text-[20px] mt-0.5">{f.icon}</span>
              <div>
                <p className="font-semibold text-[13px] mb-0.5">{f.title}</p>
                <p className="text-gris text-[12px] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-carta border border-linea rounded-2xl p-5 text-center mb-6">
          <p className="font-fraunces text-[18px] font-semibold mb-1">¿Te interesa?</p>
          <p className="text-gris text-[13px] mb-4">
            Escríbenos y te ponemos en marcha en menos de 24 h.
          </p>
          <a
            href="mailto:hola@makicar.app?subject=Quiero%20ser%20conductor%20en%20MakiCar"
            className="block w-full bg-ambar text-noche font-bold rounded-xl py-3.5 text-[14px] active:scale-[.98] transition-transform"
          >
            Contactar ahora
          </a>
        </div>

        <Link href="/login" className="block text-center text-gris text-xs underline underline-offset-2 pb-8">
          ¿Ya tienes cuenta? Entrar →
        </Link>
      </div>
    </div>
  );
}
