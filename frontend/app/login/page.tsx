"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Button } from "@/components/ui";
import { authApi, apiClient } from "@/lib/api";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { EpiDocLogo } from "@/components/EpiDocLogo";

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
      
      // Weiterleitung basierend auf Rolle
      if (response.user.role === 'patient') {
        router.push('/diary');
      } else {
        router.push('/diary');
      }
    } catch (err: any) {
      if (err.errors) {
        // Laravel Validation Errors
        const firstError = Object.values(err.errors)[0];
        setApiError(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        setApiError(err.message || 'Login fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.');
      }
    }
  };

  return (
    <div className="min-h-screen px-[var(--spacing-s)] sm:px-[var(--spacing-m)] md:px-[var(--spacing-l)] lg:px-[var(--spacing-xl)] xl:px-[var(--spacing-2xl)] 2xl:px-[var(--spacing-3xl)] py-[var(--spacing-2xs)] sm:py-[var(--spacing-s)] md:py-[var(--spacing-m)] lg:py-[var(--spacing-l)] xl:py-[var(--spacing-xl)] 2xl:py-[var(--spacing-2xl)] text-foreground-900" style={{ background: "#F2F6F4" }}>
      <div className="mx-auto flex w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-4xl flex-col gap-[var(--spacing-s)] sm:gap-[var(--spacing-m)] md:gap-[var(--spacing-l)] lg:gap-[var(--spacing-xl)]">
        <div className="space-y-[var(--spacing-2xs)] sm:space-y-[var(--spacing-2xs)]">
          <div className="flex items-center justify-center gap-[var(--spacing-xs)] mb-[var(--spacing-xs)]">
            <EpiDocLogo size={100} />
            <p className="text-headline-4 font-bold text-[#1E3F34]">EpiDoc</p>
          </div>
          <h1 className="text-headline-3 font-semibold leading-tight tracking-tight text-center py-[var(--spacing-m)] sm:py-[var(--spacing-l)] md:py-[var(--spacing-xl)]" style={{ color: "#1E3F34" }}>
            Anmelden
          </h1>
          <p className="text-body text-foreground-600 text-center">
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
          <a
            href="/forgot-password"
            className="text-body-small text-[#3E7C67] hover:text-[#346B59] transition"
          >
            Passwort vergessen?
          </a>
          <p className="text-body text-foreground-600">
            Noch kein Konto?{" "}
            <a
              href="/register"
              className="font-medium text-[#3E7C67] hover:text-[#346B59] transition"
            >
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
