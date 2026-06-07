import 'server-only';
import { Resend } from 'resend';
import { createAdminClient } from './supabase/admin';

const FROM = 'MakiCar <noreply@makicar.app>';
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://makicar.app';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

async function emailDeUsuario(userId: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(userId);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

async function emailDeConductor(conductorId: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from('conductores').select('profile_id').eq('id', conductorId).single();
    if (!data?.profile_id) return null;
    return emailDeUsuario(data.profile_id);
  } catch {
    return null;
  }
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  });
}

async function send(to: string | null, subject: string, text: string): Promise<void> {
  if (!to) return;
  const r = getResend();
  if (!r) return;
  try {
    await r.emails.send({ from: FROM, to, subject, text });
  } catch {
    // Never break the user flow over an email failure
  }
}

export async function notificarAltaConductor(p: {
  email: string;
  nombre: string;
}): Promise<void> {
  const cuerpo = [
    `¡Bienvenido a MakiCar, ${p.nombre}!`,
    ``,
    `Ya tienes acceso a tu panel de conductor. Para entrar:`,
    ``,
    `1. Ve a ${SITE}/login`,
    `2. Escribe tu email (${p.email}) y pulsa "Enviar enlace de acceso"`,
    `3. Abre el correo que recibirás y entra directamente — sin contraseñas`,
    ``,
    `Desde tu panel podrás publicar tus viajes, gestionar reservas y todo lo que necesitas para empezar.`,
    ``,
    `Cualquier duda, contáctanos: ${SITE}/conductores/contacto`,
  ].join('\n');

  await send(p.email, 'Bienvenido a MakiCar — accede a tu panel de conductor', cuerpo);
}

// ─── Notificaciones al conductor ───────────────────────────────────────────

export async function notificarNuevaReserva(p: {
  conductorId: string;
  pasajeroNombre: string;
  origen: string; destino: string; fechaHora: string;
  precioTotal: number; maleta: string; mascota: string; notas: string | null;
}): Promise<void> {
  const to = await emailDeConductor(p.conductorId);
  const cuerpo = [
    `Tienes una nueva reserva pendiente de confirmación.`,
    ``,
    `Pasajero: ${p.pasajeroNombre}`,
    `Tramo: ${p.origen} → ${p.destino}`,
    `Fecha: ${formatFecha(p.fechaHora)}`,
    `Precio total: ${p.precioTotal} €`,
    p.maleta  !== 'no' ? `Maleta: ${p.maleta  === 'maletero' ? 'en maletero (+5 €)' : 'ocupa asiento'}` : null,
    p.mascota !== 'no' ? `Mascota: ${p.mascota === 'pies'    ? 'a los pies (+5 €)'  : 'ocupa asiento'}` : null,
    p.notas ? `\nNotas del pasajero:\n${p.notas}` : null,
    ``,
    `→ Confirmar o rechazar: ${SITE}/conductor`,
  ].filter(Boolean).join('\n');

  await send(to, `Nueva reserva: ${p.pasajeroNombre} — ${p.origen} → ${p.destino}`, cuerpo);
}

export async function notificarNuevaSolicitudEspecial(p: {
  conductorId: string;
  pasajeroNombre: string;
  origenTexto: string; destinoTexto: string; fechaHora: string; numPasajeros: number;
}): Promise<void> {
  const to = await emailDeConductor(p.conductorId);
  const cuerpo = [
    `Tienes una nueva solicitud de servicio especial.`,
    ``,
    `Pasajero: ${p.pasajeroNombre}`,
    `Origen: ${p.origenTexto}`,
    `Destino: ${p.destinoTexto}`,
    `Fecha: ${formatFecha(p.fechaHora)}`,
    `Pasajeros: ${p.numPasajeros}`,
    ``,
    `→ Gestionar solicitud: ${SITE}/conductor`,
  ].join('\n');

  await send(to, `Nueva solicitud especial — ${p.origenTexto} → ${p.destinoTexto}`, cuerpo);
}

// ─── Notificaciones al pasajero ────────────────────────────────────────────

export async function notificarReservaConfirmada(p: {
  pasajeroId: string;
  origen: string; destino: string; fechaHora: string;
  precioTotal: number; formaPago: string;
}): Promise<void> {
  const to = await emailDeUsuario(p.pasajeroId);
  const cuerpo = [
    `Tu reserva ha sido confirmada. ¡Nos vemos en el viaje!`,
    ``,
    `Tramo: ${p.origen} → ${p.destino}`,
    `Fecha: ${formatFecha(p.fechaHora)}`,
    `Precio total: ${p.precioTotal} €`,
    `Forma de pago: ${p.formaPago === 'efectivo' ? 'Efectivo' : 'Tarjeta'}`,
    ``,
    `Ver detalles: ${SITE}/mis-viajes`,
  ].join('\n');

  await send(to, `✅ Reserva confirmada — ${p.origen} → ${p.destino}`, cuerpo);
}

export async function notificarReservaRechazada(p: {
  pasajeroId: string;
  origen: string; destino: string; fechaHora: string;
}): Promise<void> {
  const to = await emailDeUsuario(p.pasajeroId);
  const cuerpo = [
    `Lo sentimos, tu reserva no ha podido confirmarse para esta fecha.`,
    ``,
    `Tramo: ${p.origen} → ${p.destino}`,
    `Fecha: ${formatFecha(p.fechaHora)}`,
    ``,
    `Consulta otros viajes disponibles: ${SITE}`,
  ].join('\n');

  await send(to, `Tu reserva para ${p.origen} → ${p.destino} no ha podido confirmarse`, cuerpo);
}

export async function notificarEspecialConfirmada(p: {
  pasajeroId: string;
  origenTexto: string; destinoTexto: string; fechaHora: string;
  precioPropuesto: number; formaPago: string;
}): Promise<void> {
  const to = await emailDeUsuario(p.pasajeroId);
  const cuerpo = [
    `Tu servicio especial ha sido confirmado.`,
    ``,
    `Origen: ${p.origenTexto}`,
    `Destino: ${p.destinoTexto}`,
    `Fecha: ${formatFecha(p.fechaHora)}`,
    `Precio acordado: ${p.precioPropuesto} €`,
    `Forma de pago: ${p.formaPago === 'efectivo' ? 'Efectivo' : 'Tarjeta'}`,
    ``,
    `Ver detalles: ${SITE}/mis-viajes`,
  ].join('\n');

  await send(to, `✅ Servicio especial confirmado — ${p.origenTexto} → ${p.destinoTexto}`, cuerpo);
}

export async function notificarEspecialRechazada(p: {
  pasajeroId: string;
  origenTexto: string; destinoTexto: string;
}): Promise<void> {
  const to = await emailDeUsuario(p.pasajeroId);
  const cuerpo = [
    `Lo sentimos, tu solicitud de servicio especial no está disponible en esas fechas.`,
    ``,
    `Trayecto solicitado: ${p.origenTexto} → ${p.destinoTexto}`,
    ``,
    `Si lo necesitas, puedes solicitar otro servicio: ${SITE}/especial`,
  ].join('\n');

  await send(to, `Tu solicitud especial no está disponible`, cuerpo);
}

export async function notificarBajaConductor(p: {
  pasajeroId: string;
  origen: string; destino: string; fechaHora: string;
}): Promise<void> {
  const to = await emailDeUsuario(p.pasajeroId);
  const cuerpo = [
    `Lo sentimos, el conductor con el que tenías reservado un viaje ha dejado de operar en MakiCar.`,
    ``,
    `Tu reserva ha sido cancelada automáticamente:`,
    `Tramo: ${p.origen} → ${p.destino}`,
    `Fecha: ${formatFecha(p.fechaHora)}`,
    ``,
    `No se aplica ninguna penalización por esta cancelación.`,
    ``,
    `Si necesitas asistencia, contáctanos: ${SITE}/conductores/contacto`,
  ].join('\n');

  await send(to, `Tu reserva para ${p.origen} → ${p.destino} ha sido cancelada`, cuerpo);
}

export async function notificarBajaConductorEspecial(p: {
  pasajeroId: string;
  origenTexto: string; destinoTexto: string; fechaHora: string;
}): Promise<void> {
  const to = await emailDeUsuario(p.pasajeroId);
  const cuerpo = [
    `Lo sentimos, el conductor con el que tenías un servicio especial ha dejado de operar en MakiCar.`,
    ``,
    `Tu solicitud ha sido cancelada automáticamente:`,
    `Trayecto: ${p.origenTexto} → ${p.destinoTexto}`,
    `Fecha: ${formatFecha(p.fechaHora)}`,
    ``,
    `No se aplica ninguna penalización por esta cancelación.`,
    ``,
    `Si necesitas asistencia, contáctanos: ${SITE}/conductores/contacto`,
  ].join('\n');

  await send(to, `Tu servicio especial ha sido cancelado`, cuerpo);
}
