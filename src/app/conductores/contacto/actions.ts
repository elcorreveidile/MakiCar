'use server';

import { Resend } from 'resend';
import { redirect } from 'next/navigation';

const DESTINO = 'informa@blablaele.com';

// Bloqueo de URLs —con o sin protocolo/"www"— y de menciones de la propia marca:
// el spam de SEO/marketing siempre referencia un dominio "pelado" (p. ej. "makicar.app")
// y suele hablar de la marca en tercera persona ("we help brands connected to X…"),
// algo que un conductor real nunca escribe en su propia consulta.
const URL_RE   = /https?:\/\/|www\.|\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(?:com|net|org|io|co|app|info|biz|me|ai|es|dev|xyz)\b/i;
const MARCA_RE = /makicar/i;

export async function enviarConsulta(formData: FormData) {
  // Honeypot: bots rellenan este campo, humanos no lo ven
  const honeypot = (formData.get('website') as string) ?? '';
  if (honeypot) redirect('/conductores/contacto?enviado=1');

  // Tiempo mínimo: menos de 3 s → envío automatizado
  const ts = parseInt((formData.get('_t') as string) ?? '0', 10);
  if (!ts || Date.now() - ts < 3000) redirect('/conductores/contacto?enviado=1');

  const nombre   = (formData.get('nombre')   as string)?.trim();
  const email    = (formData.get('email')    as string)?.trim();
  const telefono = (formData.get('telefono') as string)?.trim();
  const mensaje  = (formData.get('mensaje')  as string)?.trim();

  if (!nombre || !email || !mensaje) {
    redirect('/conductores/contacto?error=campos');
  }

  // Bloqueo de URLs/dominios y de menciones de la propia marca (ver regex arriba)
  if (URL_RE.test(mensaje) || URL_RE.test(nombre) || MARCA_RE.test(mensaje) || MARCA_RE.test(nombre)) {
    redirect('/conductores/contacto?enviado=1');
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    redirect('/conductores/contacto?error=config');
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: 'MakiCar <noreply@makicar.app>',
    to: DESTINO,
    replyTo: email,
    subject: `Nueva consulta de conductor — ${nombre}`,
    text: [
      `Nombre: ${nombre}`,
      `Email: ${email}`,
      telefono ? `Teléfono: ${telefono}` : null,
      '',
      mensaje,
    ].filter(Boolean).join('\n'),
  });

  if (error) {
    redirect('/conductores/contacto?error=envio');
  }

  redirect('/conductores/contacto?enviado=1');
}
