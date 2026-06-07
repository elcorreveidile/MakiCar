import Link from 'next/link';
import MakiCarLogo from '@/components/MakiCarLogo';
import Footer from '@/components/Footer';
import { createAdminClient } from '@/lib/supabase/admin';

const PLAZAS_LANZAMIENTO = 10;

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

export default async function ConductoresPage() {
  const admin = createAdminClient();
  const { count } = await admin
    .from('conductores')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true);
  const ocupadas = count ?? 0;
  const disponibles = Math.max(0, PLAZAS_LANZAMIENTO - ocupadas);
  const agotadas = disponibles === 0;

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

        {/* Oferta lanzamiento */}
        <div className={`border-2 rounded-2xl p-5 mb-4 ${agotadas ? 'bg-[rgba(138,147,166,.06)] border-linea' : 'bg-[rgba(255,182,39,.08)] border-ambar'}`}>
          <div className="flex justify-between items-start mb-2">
            <p className={`text-[11px] font-bold uppercase tracking-widest ${agotadas ? 'text-gris' : 'text-ambar'}`}>
              Oferta de lanzamiento
            </p>
            {agotadas
              ? <span className="text-[10px] font-bold text-gris bg-[rgba(138,147,166,.14)] px-2 py-0.5 rounded-full">Agotada</span>
              : <span className="text-[10px] font-bold text-noche bg-ambar px-2 py-0.5 rounded-full">10 primeros</span>
            }
          </div>

          {agotadas ? (
            <p className="text-gris text-[14px]">Las plazas de lanzamiento están completas. Consulta el precio habitual.</p>
          ) : (
            <>
              <p className="font-fraunces text-[32px] font-semibold text-blanco leading-none mb-1">
                Gratis todo 2026
              </p>
              <p className="text-gris text-[13px] mb-3">
                Sin alta, sin cuota: no pagas nada durante todo 2026, te unas ahora o cuando la app se lance
                (previsto para finales de agosto).
              </p>

              {/* Contador de plazas */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-gris text-[11px]">Plazas disponibles</span>
                  <span className={`text-[12px] font-bold ${disponibles <= 3 ? 'text-[#E5544B]' : 'text-ambar'}`}>
                    {disponibles} de {PLAZAS_LANZAMIENTO}
                  </span>
                </div>
                <div className="w-full bg-[#0D1117] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${disponibles <= 3 ? 'bg-[#E5544B]' : 'bg-ambar'}`}
                    style={{ width: `${(disponibles / PLAZAS_LANZAMIENTO) * 100}%` }}
                  />
                </div>
              </div>

              <div className="border-t border-ambar/20 pt-3">
                <p className="text-gris text-[12px]">A partir de 2027, según tu actividad — ver tabla abajo.</p>
              </div>
            </>
          )}
        </div>

        {/* Pricing desde 2027 */}
        <div className="bg-carta border border-linea rounded-2xl p-5 mb-6">
          <p className="text-gris text-xs uppercase tracking-widest mb-1">Precios a partir de 2027</p>
          <p className="text-gris text-[12px] mb-4">Durante todo 2026 no se cobra nada. Estas tarifas entran en vigor en enero de 2027.</p>

          <div className="flex flex-col gap-3">
            <div className="bg-[#0D1117] border border-linea rounded-xl p-4">
              <p className="text-blanco text-[13px] font-semibold mb-1">Conductor no profesional</p>
              <p className="text-gris text-[12px]"><span className="text-blanco font-semibold">12 €/mes</span> o <span className="text-blanco font-semibold">120 €/año</span></p>
            </div>
            <div className="bg-[rgba(255,182,39,.06)] border border-[rgba(255,182,39,.2)] rounded-xl p-4">
              <p className="text-ambar text-[13px] font-bold mb-1">Conductor profesional</p>
              <p className="text-gris text-[12px]"><span className="text-blanco font-semibold">25 €/mes</span> o <span className="text-blanco font-semibold">200 €/año</span></p>
              <p className="text-gris text-[11px] mt-1">Según el volumen de viajes que gestiones</p>
            </div>
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

        {/* Loyalty narrative */}
        <div className="border-l-2 border-ambar pl-4 mb-8">
          <p className="font-fraunces text-[17px] font-semibold mb-2 leading-snug">
            Tus pasajeros, no los de la plataforma
          </p>
          <p className="text-gris text-[13px] leading-relaxed">
            Cada persona que reserva contigo queda vinculada a ti. Con el tiempo conoces sus rutas,
            sus horarios habituales y sus preferencias. La app guarda el historial por ti: quién
            viaja siempre los lunes, quién suele llevar maleta, quién nunca ha cancelado.
            Esa relación es tuya — no de ningún intermediario.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-carta border border-linea rounded-2xl p-5 text-center mb-6">
          <p className="font-fraunces text-[18px] font-semibold mb-1">¿Te interesa?</p>
          <p className="text-gris text-[13px] mb-4">
            Escríbenos y te ponemos en marcha en menos de 24 h.
          </p>
          <Link
            href="/conductores/contacto"
            className="block w-full bg-ambar text-noche font-bold rounded-xl py-3.5 text-[14px] text-center active:scale-[.98] transition-transform"
          >
            Contactar ahora
          </Link>
        </div>

        <div className="flex flex-col gap-2 items-center pb-8">
          <Link href="/login" className="text-gris text-xs underline underline-offset-2">
            ¿Ya tienes cuenta? Entrar →
          </Link>
          <Link href="/pasajeros" className="text-gris text-xs underline underline-offset-2">
            ¿Eres pasajero? Ver cómo funciona →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
