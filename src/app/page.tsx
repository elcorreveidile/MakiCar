import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ReservaForm from '@/components/ReservaForm';
import BottomTabs from '@/components/BottomTabs';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex flex-col min-h-screen bg-noche">
      <div className="flex-1 overflow-hidden">
        <ReservaForm nombre={profile?.nombre || 'usuario'} />
      </div>
      <BottomTabs />
    </div>
  );
}
