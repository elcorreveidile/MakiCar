'use server';

import { Resend } from 'resend';
import { redirect } from 'next/navigation';

const DESTINO = 'informa@blablaele.com';

export async function enviarConsulta(formData: FormData) {
  const nombre  = (formData.get('nombre')  as string)?.trim();
  const email   = (formData.get('email')   as string)?.trim();
  const telefono = (formData.get('telefono') as string)?.trim();
  const mensaje = (formData.get('mensaje') as string)?.trim();

  if (!nombre || !email || !mensaje) {
    redirect('/conductores/contacto?error=campos');
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
