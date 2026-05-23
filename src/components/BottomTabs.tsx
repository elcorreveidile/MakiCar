'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/',           icon: '⌂', label: 'Reservar'  },
  { href: '/especial',   icon: '＋', label: 'A medida'  },
  { href: '/mis-viajes', icon: '≡', label: 'Mis viajes' },
  { href: '/perfil',     icon: '◎', label: 'Perfil'    },
];

export default function BottomTabs() {
  const pathname = usePathname();

  return (
    <div className="flex border-t border-linea bg-[#0D1117]">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center py-3 pb-4 text-[10px] transition-colors ${
              active ? 'text-ambar' : 'text-gris'
            }`}
          >
            <span className="text-[19px] leading-none mb-0.5">{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
