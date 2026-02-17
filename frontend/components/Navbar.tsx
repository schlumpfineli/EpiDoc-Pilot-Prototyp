'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EpiDocLogo } from '@/components/EpiDocLogo';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRoleText } from '@/lib/hooks/useRoleText';

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

  // Navigation-Links nur für eingeloggte Benutzer
  const navLinks = user ? [
    { href: '/befinden', label: t('Wie geht es dir?') },
    { href: '/diary', label: 'Tagebuch' },
    { href: '/medikamente', label: 'Medikamente' },
    { href: '/verlauf', label: 'Analyse' },
    { href: '/profil', label: 'Profil' },
    { href: '/einstellungen', label: 'Einstellungen' },
  ] : [];

  // Öffentliche Routen (keine Navbar)
  const publicRoutes = ['/login', '/register'];
  if (publicRoutes.includes(pathname)) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-background-200/60 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-s">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Branding */}
          <Link 
            href={user ? '/diary' : '/'} 
            className="flex items-center gap-2"
          >
            <EpiDocLogo size={32} className="h-8 w-8 shrink-0" />
          </Link>

          {/* Desktop Navigation (ab xl; Tablet nutzt Menü-Button) */}
          {user && navLinks.length > 0 && (
            <div className="hidden xl:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-s py-2xs rounded-lg text-body-small font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive(link.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-foreground-400 hover:text-foreground-800 hover:bg-background-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right Side - User Menu / Auth Buttons */}
          <div className="flex items-center gap-s">
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-background-200" />
            ) : user ? (
              <>
                {/* Desktop User Menu */}
                <div className="hidden xl:flex items-center gap-m">
                  <span className="text-body text-foreground-600">
                    {user.display_name}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleLogout}
                  >
                    Abmelden
                  </Button>
                </div>

                {/* Menü-Button (Mobile + Tablet) */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="xl:hidden p-2 rounded-xl text-foreground-700 hover:bg-background-100"
                  aria-label="Menü öffnen"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isMobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2xs">
                <Link href="/login">
                  <Button variant="secondary" size="sm">
                    Anmelden
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Registrieren
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Ausklapp-Menü (Mobile + Tablet) */}
        {isMobileMenuOpen && user && (
          <div className="border-t border-background-200/60 py-s xl:hidden">
            <div className="space-y-2xs">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-m py-s rounded-lg text-body font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-foreground-500 hover:text-foreground-800 hover:bg-background-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-background-200/60 pt-2xs mt-2xs">
                <div className="px-m py-s text-body-small text-foreground-400">
                  {user.display_name}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-m py-s rounded-lg text-body font-medium text-foreground-500 hover:text-foreground-800 hover:bg-background-50"
                >
                  Abmelden
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

