import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ProfileForm from './ProfileForm';
import { cerrarSesion } from './actions';
import MakiCarLogo from '@/components/MakiCarLogo';
import BottomTabs from '@/components/BottomTabs';

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ guardado?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, telefono, direccion_habitual_recogida, avatar_url')
    .eq('id', user.id)
    .single();

  const { guardado } = await searchParams;

  return (
    <div className="flex flex-col min-h-screen bg-noche">
      {/* TopBar */}
      <div className="sticky top-0 z-10 bg-[#0D1117] border-b border-linea px-5 pt-10 pb-3.5 flex justify-between items-center">
        <MakiCarLogo />
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="text-gris text-[11px] border border-linea rounded-lg px-2.5 py-1 font-semibold active:scale-[.97] transition-transform"
          >
            Salir
          </button>
        </form>
      </div>

      <div className="flex-1 px-5 py-5 overflow-y-auto">
        <h2 className="font-fraunces text-[23px] font-semibold mb-1">Mi perfil</h2>
        <p className="text-gris text-[13px] mb-6">{user.email}</p>

        <ProfileForm
          nombre={profile?.nombre ?? ''}
          telefono={profile?.telefono ?? null}
          direccion={profile?.direccion_habitual_recogida ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          guardado={guardado === '1'}
        />
      </div>

      <BottomTabs />
    </div>
  );
}
