import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const conductorId = searchParams.get('c');

  // Usar el dominio público configurado para evitar bucles en producción
  // cuando el proxy o Vercel cambian el origin de la petición entrante.
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Si viene de un enlace de invitación, vincular al conductor (solo si no tiene uno ya)
      if (conductorId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ conductor_id: conductorId })
            .eq('id', user.id)
            .is('conductor_id', null);
        }
      }
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  return NextResponse.redirect(`${base}/login?error=enlace_invalido`);
}
