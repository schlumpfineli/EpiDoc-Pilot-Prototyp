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
      className="flex w-fit rounded-full bg-[#E7EEEB] p-[3px]"
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
            className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
              active ? "bg-[#3F7A63] text-white" : "bg-transparent text-[#3F5F53] hover:text-[#1E3F34]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
