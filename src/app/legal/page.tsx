import Link from 'next/link';
import MakiCarLogo from '@/components/MakiCarLogo';
import Footer from '@/components/Footer';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-fraunces text-[18px] font-semibold mb-3 text-blanco">{title}</h2>
      <div className="text-gris text-[13px] leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-noche flex flex-col">
      <div className="bg-[#0D1117] border-b border-linea px-5 pt-10 pb-4 flex items-center">
        <MakiCarLogo />
      </div>

      <div className="flex-1 px-5 py-8 max-w-lg mx-auto w-full">
        <Link href="/" className="text-gris text-xs mb-6 block">← Volver</Link>

        <h1 className="font-fraunces text-[26px] font-semibold mb-1">Aviso legal y privacidad</h1>
        <p className="text-gris text-[12px] mb-8">Última actualización: mayo de 2026</p>

        {/* AVISO LEGAL */}
        <p className="text-gris text-xs uppercase tracking-widest mb-4">Aviso legal</p>

        <Section title="Titular del servicio">
          <p>
            El servicio MakiCar es operado por <strong className="text-blanco">espanias.com</strong>,
            con domicilio en <strong className="text-blanco">M Magdalena, 5. Estepona (Málaga)</strong> y dirección de contacto a través del{' '}
            <Link href="/conductores/contacto" className="text-ambar underline underline-offset-2">formulario de contacto</Link>.
          </p>
        </Section>

        <Section title="Objeto del servicio">
          <p>
            MakiCar es una plataforma digital que facilita la gestión de reservas de transporte compartido
            en la ruta Granada · Málaga · Marbella · Estepona · Algeciras, conectando a pasajeros con su
            conductor habitual. El servicio de transporte es prestado directamente por el conductor; MakiCar
            actúa como herramienta de gestión y no como transportista.
          </p>
        </Section>

        <Section title="Propiedad intelectual">
          <p>
            Todos los contenidos, diseño y código de la plataforma son propiedad del titular del servicio.
            Queda prohibida su reproducción, distribución o modificación sin autorización expresa.
          </p>
        </Section>

        {/* PRIVACIDAD */}
        <div className="border-t border-linea my-8" />
        <p className="text-gris text-xs uppercase tracking-widest mb-4">Política de privacidad</p>

        <Section title="Responsable del tratamiento">
          <p>
            <strong className="text-blanco">espanias.com</strong> · M Magdalena, 5. Estepona (Málaga) —{' '}
            <Link href="/conductores/contacto" className="text-ambar underline underline-offset-2">formulario de contacto</Link>
          </p>
        </Section>

        <Section title="Datos que recogemos">
          <ul className="list-disc list-inside space-y-1">
            <li>Dirección de correo electrónico (identificación y comunicaciones).</li>
            <li>Nombre (para personalizar el servicio).</li>
            <li>Historial de reservas: trayecto, fecha, precio, forma de pago.</li>
            <li>Información sobre equipaje y mascotas facilitada al reservar.</li>
          </ul>
        </Section>

        <Section title="Finalidad y base jurídica">
          <p>
            Tratamos tus datos para gestionar las reservas y comunicarte el estado de las mismas
            (base jurídica: ejecución de un contrato, art. 6.1.b RGPD). También podemos enviarte
            comunicaciones relacionadas con el servicio (interés legítimo, art. 6.1.f RGPD).
          </p>
        </Section>

        <Section title="Destinatarios">
          <p>
            Tus datos no se ceden a terceros salvo obligación legal. El conductor asignado accede
            a los datos necesarios para prestar el servicio (nombre, trayecto, fecha, equipaje).
            Utilizamos Supabase (almacenamiento) y Resend (envío de emails), ambos con las garantías
            adecuadas conforme al RGPD.
          </p>
        </Section>

        <Section title="Conservación">
          <p>
            Conservamos tus datos mientras uses el servicio y durante los plazos legalmente exigidos
            (hasta 5 años para datos de facturación). Puedes solicitar la eliminación en cualquier momento.
          </p>
        </Section>

        <Section title="Tus derechos">
          <p>
            Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y
            portabilidad a través de nuestro{' '}
            <Link href="/conductores/contacto" className="text-ambar underline underline-offset-2">formulario de contacto</Link>.
            También tienes derecho a presentar una reclamación ante la{' '}
            <strong className="text-blanco">Agencia Española de Protección de Datos (AEPD)</strong>.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            MakiCar utiliza únicamente cookies técnicas de sesión, necesarias para el funcionamiento
            del servicio de autenticación. No se utilizan cookies de seguimiento ni publicidad.
          </p>
        </Section>

        <div className="border-t border-linea my-8" />
        <p className="text-gris text-[12px] text-center mb-4">
          ¿Tienes preguntas?{' '}
          <Link href="/conductores/contacto" className="text-ambar underline underline-offset-2">
            Escríbenos aquí
          </Link>
        </p>
      </div>

      <Footer />
    </div>
  );
}
