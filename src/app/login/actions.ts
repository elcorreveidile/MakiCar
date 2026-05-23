'use server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function enviarMagicLink(formData: FormData) {
  const email = (formData.get('email') as string).trim().toLowerCase();
  if (!email) redirect('/login?error=email_requerido');

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });

  if (error) redirect('/login?error=envio_fallido');
  redirect('/login?enviado=1');
}
