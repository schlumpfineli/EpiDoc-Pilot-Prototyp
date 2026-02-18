'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EpiDocLogo } from '@/components/EpiDocLogo';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRoleText } from '@/lib/hooks/useRoleText';

const HeartIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const BookIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const PillIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </svg>
);

const ChartIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

const UserIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

type NavTab = {
  href: string;
  label: string;
  icon: (props: { active: boolean }) => React.ReactNode;
  type: 'emotional' | 'functional' | 'analytical' | 'administrative';
};

export function Navbar() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const { t } = useRoleText();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logout();
  };

  const isActive = (path: string) => pathname === path;

  const tabs: NavTab[] = [
    { href: '/befinden', label: 'Heute', icon: HeartIcon, type: 'emotional' },
    { href: '/diary', label: 'Tagebuch', icon: BookIcon, type: 'functional' },
    { href: '/medikamente', label: 'Medikamente', icon: PillIcon, type: 'functional' },
    { href: '/verlauf', label: 'Analyse', icon: ChartIcon, type: 'analytical' },
    { href: '/profil', label: 'Profil', icon: UserIcon, type: 'administrative' },
  ];

  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  if (publicRoutes.some(r => pathname.startsWith(r))) {
    return null;
  }

  const desktopNavLinks = user ? [
    { href: '/befinden', label: t('Heute') },
    { href: '/diary', label: 'Tagebuch' },
    { href: '/medikamente', label: 'Medikamente' },
    { href: '/verlauf', label: 'Analyse' },
    { href: '/profil', label: 'Profil' },
    { href: '/einstellungen', label: 'Einstellungen' },
  ] : [];

  return (
    <>
      {/* ── Desktop Top Bar (xl+) ── */}
      <nav className="sticky top-0 z-50 hidden xl:block" style={{ borderBottom: '1px solid #E3EAE6', background: '#F6F8F7' }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-14 items-center justify-between">
            <Link href={user ? '/diary' : '/'} className="flex items-center gap-2">
              <EpiDocLogo size={28} className="h-7 w-7 shrink-0" />
              <span className="text-[15px] font-semibold" style={{ color: '#243B2E' }}>EpiDoc</span>
            </Link>

            {user && desktopNavLinks.length > 0 && (
              <div className="flex items-center gap-0.5">
                {desktopNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150"
                    style={{
                      color: isActive(link.href) ? '#2F6B55' : '#9BAFA6',
                      background: isActive(link.href) ? '#E4F2EC' : 'transparent',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4">
              {isLoading ? (
                <div className="h-7 w-7 animate-pulse rounded-full" style={{ background: '#E5ECE8' }} />
              ) : user ? (
                <div className="flex items-center gap-4">
                  <span className="text-[13px]" style={{ color: '#6F7F75' }}>{user.display_name}</span>
                  <Button variant="secondary" size="sm" onClick={handleLogout}>Abmelden</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login"><Button variant="secondary" size="sm">Anmelden</Button></Link>
                  <Link href="/register"><Button variant="primary" size="sm">Registrieren</Button></Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Top Bar (< xl) — nur Logo + Menü ── */}
      <nav className="sticky top-0 z-50 xl:hidden" style={{ borderBottom: '1px solid #E3EAE6', background: 'rgba(246,248,247,0.95)', backdropFilter: 'blur(8px)' }}>
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex h-12 items-center justify-between">
            <Link href={user ? '/diary' : '/'} className="flex items-center gap-2">
              <EpiDocLogo size={26} className="h-[26px] w-[26px] shrink-0" />
              <span className="text-[14px] font-semibold" style={{ color: '#243B2E' }}>EpiDoc</span>
            </Link>

            {!user && (
              <div className="flex items-center gap-2">
                <Link href="/login"><Button variant="secondary" size="sm">Anmelden</Button></Link>
                <Link href="/register"><Button variant="primary" size="sm">Registrieren</Button></Link>
              </div>
            )}

            {user && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-lg p-1.5 transition"
                style={{ color: '#6F7F75' }}
                aria-label="Menü"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 8h16M4 16h16" />
                  )}
                </svg>
              </button>
            )}
          </div>

          {isMobileMenuOpen && user && (
            <div className="border-t py-2 space-y-0.5" style={{ borderColor: '#E3EAE6' }}>
              <Link
                href="/einstellungen"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-[13px] font-medium transition-colors"
                style={{ color: isActive('/einstellungen') ? '#2F6B55' : '#6F7F75' }}
              >
                Einstellungen
              </Link>
              <div className="border-t pt-2 mt-1" style={{ borderColor: '#E3EAE6' }}>
                <div className="px-3 py-1 text-[11px]" style={{ color: '#9BAFA6' }}>{user.display_name}</div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left rounded-lg px-3 py-2 text-[13px] font-medium transition-colors"
                  style={{ color: '#6F7F75' }}
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
          style={{
            height: 64,
            background: '#F6F8F7',
            borderTop: '1px solid #E3EAE6',
            boxShadow: '0 -1px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div className="flex h-full items-center justify-around px-3">
            {tabs.map((tab) => {
              const active = isActive(tab.href);
              const isEmotional = tab.type === 'emotional';

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="relative flex flex-col items-center justify-center gap-[2px] flex-1"
                  style={{ paddingTop: 8, paddingBottom: 10 }}
                >
                  {/* Soft-Pill Background (aktiv) */}
                  {active && (
                    <div
                      className="absolute inset-x-1 top-1 bottom-1.5 rounded-2xl transition-all duration-150"
                      style={{
                        background: isEmotional
                          ? 'linear-gradient(180deg, #E9F4EF 0%, #F6FAF8 100%)'
                          : '#E4F2EC',
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className="relative z-10 transition-transform duration-[120ms] ease-out"
                    style={{
                      color: active
                        ? (isEmotional ? '#3E7C67' : '#2F6B55')
                        : '#9BAFA6',
                      transform: active ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    <tab.icon active={active} />
                  </div>

                  {/* Label */}
                  <span
                    className="relative z-10 transition-colors duration-[120ms] ease-out"
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: active
                        ? (isEmotional ? '#3E7C67' : '#2F6B55')
                        : '#9BAFA6',
                    }}
                  >
                    {tab.label}
                  </span>

                  {/* Floating Indicator */}
                  <div
                    className="absolute bottom-[5px] left-1/2 -translate-x-1/2 rounded-[3px] transition-all duration-[120ms] ease-out"
                    style={{
                      width: active ? 18 : 0,
                      height: 3,
                      background: '#7BC4A5',
                      opacity: active ? 1 : 0,
                    }}
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
