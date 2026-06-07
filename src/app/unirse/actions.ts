'use server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function unirseConConductor(formData: FormData) {
  const email = (formData.get('email') as string).trim().toLowerCase();
  const conductorId = formData.get('conductor_id') as string;

  if (!email || !conductorId) redirect(`/unirse?c=${conductorId}`);

  const supabase = await createClient();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback?c=${conductorId}` },
  });

  if (error) redirect(`/unirse?c=${conductorId}&error=envio_fallido`);
  redirect(`/unirse?c=${conductorId}&enviado=1`);
}
