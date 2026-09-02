import Link from "next/link";
import { AUTH_BRAND_COLOR, AUTH_GRADIENT, AUTH_LINK_CLASS, AUTH_LINK_CLASS_SMALL } from "@/lib/auth-constants";
import { EpiDocLogo } from "@/components/EpiDocLogo";

export function LegalPageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen px-[var(--spacing-s)] sm:px-[var(--spacing-m)] py-[var(--spacing-m)] text-foreground-900"
      style={{ background: AUTH_GRADIENT }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-[var(--spacing-m)]">
        <div className="flex items-center justify-center gap-[var(--spacing-xs)]">
          <EpiDocLogo size={64} />
          <p className="text-headline-4 font-bold" style={{ color: AUTH_BRAND_COLOR }}>
            EpiDoc
          </p>
        </div>
        <h1
          className="text-headline-3 font-semibold leading-tight tracking-tight text-center"
          style={{ color: AUTH_BRAND_COLOR }}
        >
          {title}
        </h1>
        <div className="rounded-2xl border border-[#DDE7E2] bg-white/80 p-[var(--spacing-m)] space-y-[var(--spacing-s)] text-body-small text-foreground-700 leading-relaxed">
          {children}
        </div>
        <p className="text-center text-body-small text-foreground-600">
          <Link href="/login" className={AUTH_LINK_CLASS}>
            Zum Login
          </Link>
          {" · "}
          <Link href="/register" className={AUTH_LINK_CLASS}>
            Registrieren
          </Link>
          {" · "}
          <Link href="/datenschutz" className={AUTH_LINK_CLASS_SMALL}>
            Datenschutz
          </Link>
          {" · "}
          <Link href="/impressum" className={AUTH_LINK_CLASS_SMALL}>
            Impressum
          </Link>
        </p>
      </div>
    </div>
  );
}
