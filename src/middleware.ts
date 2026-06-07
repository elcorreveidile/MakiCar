import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Rutas típicas de escaneo automático que no existen en MakiCar (Next.js).
// Si alguien las prueba, en vez del 404 genérico le mostramos una "trampa"
// con guasa: la cabecera x-trampa le indica a not-found.tsx qué chiste usar.
const TRAMPAS: Record<string, RegExp> = {
  env:       /(?:^|\/)\.env(?:\.|$)/i,
  wordpress: /wp-(?:admin|login|content|includes|json)|xmlrpc\.php/i,
  git:       /(?:^|\/)\.git(?:\/|$)/i,
  php:       /phpmyadmin|adminer|wp-config|\.php$/i,
  secretos:  /id_rsa|\.ssh|\.aws|\.(?:sql|bak|zip|tar(?:\.gz)?)$/i,
};

function detectarTrampa(pathname: string): string | undefined {
  return Object.entries(TRAMPAS).find(([, re]) => re.test(pathname))?.[0];
}

export async function middleware(request: NextRequest) {
  const trampa = detectarTrampa(request.nextUrl.pathname);
  const requestHeaders = new Headers(request.headers);
  if (trampa) requestHeaders.set('x-trampa', trampa);

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Solo refresca la sesión. Los redirects por rol o auth
  // se hacen en cada page.tsx, donde las cookies ya están disponibles.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
