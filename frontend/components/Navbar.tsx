'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EpiDocLogo } from '@/components/EpiDocLogo';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRoleText } from '@/lib/hooks/useRoleText';

// ─── Design Tokens ──────────────────────────────────────────────────────────

const C = {
  bg:          '#FFFFFF',
  border:      '#DDE7E2',
  brand:       '#1E3F34',
  iconActive:  '#3E7C67',
  labelActive: '#1E3F34',
  emotional:   '#1E3F34',
  inactive:    '#5A7368',
  secondary:   '#3F5F54',
  activeBg:    '#D6EAE2',
  indicator:   '#3E7C67',
  skeleton:    '#DDE7E2',
  emotionalGradient: 'linear-gradient(180deg, #E4F2EC 0%, #F2F6F4 100%)',
} as const;

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];
const pilotEnableProfilePage = process.env.NEXT_PUBLIC_PILOT_ENABLE_PROFILE_PAGE === 'true';

// ─── Icons ──────────────────────────────────────────────────────────────────

type IconProps = { active: boolean };

const HeartIcon = ({ active }: IconProps) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const BookIcon = ({ active }: IconProps) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const PillIcon = ({ active }: IconProps) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </svg>
);

const ChartIcon = ({ active }: IconProps) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

const UserIcon = ({ active }: IconProps) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// ─── Types ───────────────────────────────────────────────────────────────────

type TabType = 'emotional' | 'functional' | 'analytical' | 'administrative';

type NavTab = {
  href: string;
  label: string;
  icon: (props: IconProps) => React.ReactNode;
  type: TabType;
};

// ─── Tab Definitions (single source of truth) ───────────────────────────────

const TAB_DEFS: NavTab[] = [
  { href: '/befinden',    label: 'Heute',       icon: HeartIcon, type: 'emotional' },
  { href: '/diary',       label: 'Tagebuch',    icon: BookIcon,  type: 'functional' },
  { href: '/medikamente', label: 'Medikamente', icon: PillIcon,  type: 'functional' },
  { href: '/verlauf',     label: 'Analyse',     icon: ChartIcon, type: 'analytical' },
  ...(pilotEnableProfilePage ? [{ href: '/profil', label: 'Profil', icon: UserIcon, type: 'administrative' as const }] : []),
];

// ─── Subcomponents ───────────────────────────────────────────────────────────

function BrandLogo({ size, textSize }: { size: number; textSize: string }) {
  return (
    <>
      <EpiDocLogo size={size} className="shrink-0" />
      <span className={`${textSize} font-semibold`} style={{ color: C.brand }}>EpiDoc</span>
    </>
  );
}

function AuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/login"><Button variant="secondary" size="sm">Anmelden</Button></Link>
      <Link href="/register"><Button variant="primary" size="sm">Registrieren</Button></Link>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function Navbar() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const { t } = useRoleText();
  const [menuOpen, setMenuOpen] = useState(false);

  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) return null;

  const handleLogout = () => { setMenuOpen(false); logout(); };
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const tabIconColor = (active: boolean, emotional: boolean) =>
    active ? (emotional ? C.emotional : C.iconActive) : C.inactive;
  const tabLabelColor = (active: boolean) =>
    active ? C.labelActive : C.inactive;

  const desktopLinks = [
    ...TAB_DEFS.map(tab => ({ href: tab.href, label: t(tab.label) })),
    { href: '/einstellungen', label: t('Einstellungen') },
  ];

  return (
    <>
      {/* ── Desktop Top Bar (xl+) ── */}
      <nav
        className="sticky top-0 z-50 hidden xl:block"
        style={{ borderBottom: `1px solid ${C.border}`, background: C.bg }}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-14 items-center justify-between">
            <Link href={user ? '/diary' : '/'} className="flex items-center gap-2">
              <BrandLogo size={28} textSize="text-[15px]" />
            </Link>

            {user && (
              <div className="flex items-center gap-0.5">
                {desktopLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-lg px-3 py-1.5 text-[13px] font-medium"
                      style={{ color: active ? C.labelActive : C.inactive, background: active ? C.activeBg : 'transparent', transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-4">
              {isLoading ? (
                <div className="h-7 w-7 animate-pulse rounded-full" style={{ background: C.skeleton }} />
              ) : user ? (
                <div className="flex items-center gap-3">
                  <span className="text-[13px]" style={{ color: C.secondary }}>{user.display_name ?? ''}</span>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg border px-2.5 py-1 text-[13px] font-medium transition-colors"
                    style={{ borderColor: C.border, color: C.secondary }}
                  >
                    Abmelden
                  </button>
                </div>
              ) : (
                <AuthButtons />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Top Bar (< xl) ── */}
      <nav
        className="sticky top-0 z-50 xl:hidden"
        style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(246,248,247,0.95)', backdropFilter: 'blur(8px)' }}
      >
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex h-12 items-center justify-between">
            <Link href={user ? '/diary' : '/'} className="flex items-center gap-2">
              <BrandLogo size={26} textSize="text-[14px]" />
            </Link>

            {!user && <AuthButtons />}

            {user && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-lg p-1.5 transition"
                style={{ color: C.secondary }}
                aria-label={menuOpen ? 'Menü schliessen' : 'Menü öffnen'}
                aria-expanded={menuOpen}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 8h16M4 16h16" />
                  )}
                </svg>
              </button>
            )}
          </div>

          {menuOpen && user && (
            <div className="border-t py-2 space-y-0.5" style={{ borderColor: C.border }}>
              <Link
                href="/einstellungen"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-[13px] font-medium transition-colors"
                style={{ color: isActive('/einstellungen') ? C.labelActive : C.secondary }}
              >
                {t('Einstellungen')}
              </Link>
              <div className="border-t pt-2 mt-1" style={{ borderColor: C.border }}>
                <div className="px-3 py-1 text-[11px]" style={{ color: C.inactive }}>{user.display_name ?? ''}</div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left rounded-lg px-3 py-2 text-[13px] font-medium transition-colors"
                  style={{ color: C.secondary }}
                >
                  Abmelden
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Bottom Tab Bar (< xl) ── */}
      {user && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 xl:hidden"
          role="navigation"
          aria-label="Hauptnavigation"
          style={{ height: 64, background: C.bg, borderTop: `1px solid ${C.border}`, boxShadow: '0 -1px 8px rgba(0,0,0,0.03)' }}
        >
          <div className="flex h-full items-center justify-around px-3">
            {TAB_DEFS.map((tab) => {
              const active = isActive(tab.href);
              const emotional = tab.type === 'emotional';
              const iconColor = tabIconColor(active, emotional);
              const labelColor = tabLabelColor(active);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className="relative flex flex-col items-center justify-center gap-[2px] flex-1"
                  style={{ paddingTop: 8, paddingBottom: 10 }}
                >
                  {active && (
                    <div
                      className="absolute inset-x-1 top-1 bottom-1.5 rounded-2xl"
                      style={{ background: emotional ? C.emotionalGradient : C.activeBg, transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                  )}

                  <div
                    className="relative z-10"
                    style={{ color: iconColor, transform: active ? 'scale(1.08)' : 'scale(1)', transition: 'transform 120ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                  >
                    <tab.icon active={active} />
                  </div>

                  <span
                    className="relative z-10 text-[11px] font-medium"
                    style={{ color: labelColor, transition: 'color 120ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                  >
                    {tab.label}
                  </span>

                  <div
                    className="absolute bottom-[5px] left-1/2 -translate-x-1/2 rounded-[3px]"
                    style={{ width: active ? 18 : 0, height: 3, background: C.indicator, opacity: active ? 1 : 0, transition: 'all 120ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
