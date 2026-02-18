"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Button } from "@/components/ui";
import { authApi, apiClient } from "@/lib/api";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { EpiDocLogo } from "@/components/EpiDocLogo";
import { AUTH_GRADIENT, AUTH_LINK_CLASS, AUTH_LINK_CLASS_SMALL, AUTH_BRAND_COLOR } from "@/lib/auth-constants";
import { extractApiError } from "@/lib/errorUtils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Prüfe ob Passwort-Reset erfolgreich war
    if (searchParams.get('password-reset') === 'success') {
      setSuccessMessage('Passwort erfolgreich zurückgesetzt! Sie können sich jetzt anmelden.');
      // Entferne Query-Parameter aus URL
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, router]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setApiError(null);
      const response = await authApi.login(data);
      
      // Token speichern
      apiClient.setToken(response.token);
      
      // Event dispatchen, damit andere Komponenten (z.B. Navbar) den Auth-Status aktualisieren
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-changed"));
      }
      
      router.push('/diary');
    } catch (err) {
      setApiError(extractApiError(err, "Login fehlgeschlagen. Bitte überprüfe deine Zugangsdaten."));
    }
  };

  return (
    <div className="min-h-screen px-[var(--spacing-s)] sm:px-[var(--spacing-m)] md:px-[var(--spacing-l)] lg:px-[var(--spacing-xl)] xl:px-[var(--spacing-2xl)] 2xl:px-[var(--spacing-3xl)] py-[var(--spacing-2xs)] sm:py-[var(--spacing-s)] md:py-[var(--spacing-m)] lg:py-[var(--spacing-l)] xl:py-[var(--spacing-xl)] 2xl:py-[var(--spacing-2xl)] text-foreground-900" style={{ background: AUTH_GRADIENT }}>
      <div className="mx-auto flex w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-4xl flex-col gap-[var(--spacing-s)] sm:gap-[var(--spacing-m)] md:gap-[var(--spacing-l)] lg:gap-[var(--spacing-xl)]">
        <div className="space-y-[var(--spacing-s)] sm:space-y-[var(--spacing-m)]">
          <div className="flex items-center justify-center gap-[var(--spacing-xs)] mb-[var(--spacing-xs)]">
            <EpiDocLogo size={100} />
            <p className="text-headline-4 font-bold" style={{ color: AUTH_BRAND_COLOR }}>EpiDoc</p>
          </div>
          <h1 className="text-headline-3 font-semibold leading-tight tracking-tight text-center py-[var(--spacing-m)] sm:py-[var(--spacing-l)] md:py-[var(--spacing-xl)]" style={{ color: AUTH_BRAND_COLOR }}>
            Anmelden
          </h1>
          <p className="text-body-small text-foreground-600 text-center leading-relaxed">
            Melde dich mit deiner E-Mail und deinem Passwort an.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-[var(--spacing-l)]">
          <Input
            label="E-Mail"
            type="email"
            placeholder="deine@email.de"
            autoComplete="email"
            {...register("email")}
            error={errors.email?.message}
          />

          <Input
            label="Passwort"
            type="password"
            placeholder="Passwort"
            autoComplete="current-password"
            {...register("password")}
            error={errors.password?.message}
          />

          {successMessage && (
            <div className="rounded-lg border border-success-200 bg-success-50 px-[var(--spacing-m)] py-[var(--spacing-s)]">
              <p className="text-body-small text-success-700">{successMessage}</p>
            </div>
          )}

          {apiError && (
            <div className="rounded-lg border border-warning-200 bg-warning-50 px-[var(--spacing-m)] py-[var(--spacing-s)]">
              <p className="text-body-small text-warning-700">{apiError}</p>
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Lädt..." : "Login"}
          </Button>
        </form>

        <div className="flex flex-col gap-[var(--spacing-xs)] text-center">
          <a href="/forgot-password" className={AUTH_LINK_CLASS_SMALL}>
            Passwort vergessen?
          </a>
          <p className="text-body text-foreground-600">
            Noch kein Konto?{" "}
            <a href="/register" className={AUTH_LINK_CLASS}>
              Jetzt registrieren
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-body text-foreground-600">Lädt...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
