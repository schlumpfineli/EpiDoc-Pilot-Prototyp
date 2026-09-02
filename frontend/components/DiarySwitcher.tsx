'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/diary/anfaelle', label: 'Anfälle' },
  { href: '/diary/gedanken', label: 'Gedanken' },
] as const;

export function DiarySwitcher() {
  const pathname = usePathname();

  return (
    <div
      className="flex rounded-2xl p-1"
      style={{ background: '#FFFFFF' }}
      role="tablist"
      aria-label="Tagebuch-Bereich"
    >
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            role="tab"
            aria-selected={active}
            className="flex-1 rounded-xl py-2 text-center text-body-small font-medium transition"
            style={{
              background: active ? '#3F7A63' : 'transparent',
              color: active ? '#FFFFFF' : '#3F5F53',
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
