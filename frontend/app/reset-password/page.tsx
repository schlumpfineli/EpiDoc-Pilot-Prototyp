"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Input, Button } from "@/components/ui";
import { authApi } from "@/lib/api";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations";
import { AUTH_GRADIENT, AUTH_LINK_CLASS_SMALL } from "@/lib/auth-constants";
import { extractApiError } from "@/lib/errorUtils";
import { AuthSuccessIcon } from "@/components/auth/AuthSuccessIcon";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    // Hole Token und E-Mail aus URL-Parametern
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (tokenParam && emailParam) {
      setToken(tokenParam);
      setEmail(emailParam);
      setValue('token', tokenParam);
      setValue('email', emailParam);
    } else {
      // Wenn keine Parameter vorhanden sind, zeige Fehler
      setApiError('Ungültiger Reset-Link. Bitte fordern Sie einen neuen an.');
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setIsLoading(true);
      setApiError(null);
      
      await authApi.resetPassword(data);
      
      setIsSuccess(true);
      
      // Weiterleitung zum Login nach 3 Sekunden mit Success-Parameter
      setTimeout(() => {
        router.push('/login?password-reset=success');
      }, 3000);
    } catch (err) {
      setApiError(extractApiError(err, "Fehler beim Zurücksetzen des Passworts. Bitte versuchen Sie es erneut."));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center px-[var(--spacing-m)]" style={{ background: AUTH_GRADIENT }}>
        <div className="max-w-md w-full space-y-[var(--spacing-xl)]">
          <div className="rounded-2xl bg-white border border-background-200/60 p-[var(--spacing-xl)] text-center space-y-[var(--spacing-l)]">
            <AuthSuccessIcon />
            <div className="space-y-[var(--spacing-m)]">
              <h1 className="text-h4 sm:text-h3 font-semibold text-foreground-900">
                Passwort erfolgreich zurückgesetzt
              </h1>
              <p className="text-body text-foreground-700">
                Ihr Passwort wurde erfolgreich geändert. Sie werden gleich zum Login weitergeleitet.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-[var(--spacing-s)]">
            <Link href="/login">
              <Button variant="primary" fullWidth>
                Zum Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center px-[var(--spacing-m)]" style={{ background: AUTH_GRADIENT }}>
        <div className="max-w-md w-full space-y-[var(--spacing-xl)]">
          <div className="rounded-2xl bg-white border border-background-200/60 p-[var(--spacing-xl)] text-center space-y-[var(--spacing-l)]">
            <div className="space-y-[var(--spacing-m)]">
              <div className="rounded-lg border border-warning-200/60 bg-warning-50/50 p-[var(--spacing-m)]">
                <h1 className="text-h4 sm:text-h3 font-semibold text-foreground-900 mb-[var(--spacing-xs)]">
                  Ungültiger Reset-Link
                </h1>
                <p className="text-body text-foreground-700">
                  {apiError || 'Der Reset-Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-[var(--spacing-s)]">
              <Link href="/forgot-password">
                <Button variant="primary" fullWidth>
                  Neuen Reset-Link anfordern
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" fullWidth>
                  Zurück zum Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-[var(--spacing-m)]" style={{ background: AUTH_GRADIENT }}>
      <div className="max-w-md w-full space-y-[var(--spacing-xl)]">
        <div className="rounded-2xl bg-white border border-background-200/60 p-[var(--spacing-xl)] space-y-[var(--spacing-l)]">
          <div className="text-center space-y-[var(--spacing-m)]">
            <h1 className="text-h4 sm:text-h3 font-semibold text-foreground-900">
              Neues Passwort setzen
            </h1>
            <p className="text-body text-foreground-600">
              Bitte geben Sie Ihr neues Passwort ein.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[var(--spacing-l)]">
            {apiError && (
              <div className="rounded-lg border border-warning-200/60 bg-warning-50/50 p-[var(--spacing-m)]">
                <p className="text-body-small text-warning-700">{apiError}</p>
              </div>
            )}

          {/* Hidden fields für Token und E-Mail */}
          <input type="hidden" {...register('token')} />
          <input type="hidden" {...register('email')} />

          <div className="space-y-[var(--spacing-s)]">
            <Input
              label="E-Mail-Adresse"
              type="email"
              value={email}
              disabled
              className="bg-background-100"
            />
            
            <Input
              label="Neues Passwort"
              type="password"
              placeholder="Mindestens 8 Zeichen"
              error={errors.password?.message}
              {...register('password')}
              disabled={isLoading}
              required
              helperText="Mindestens 8 Zeichen, 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl"
            />

            <Input
              label="Passwort bestätigen"
              type="password"
              placeholder="Passwort wiederholen"
              error={errors.password_confirmation?.message}
              {...register('password_confirmation')}
              disabled={isLoading}
              required
            />
          </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? 'Wird zurückgesetzt...' : 'Passwort zurücksetzen'}
            </Button>
          </form>

          <div className="text-center pt-[var(--spacing-xs)]">
            <Link href="/login" className={AUTH_LINK_CLASS_SMALL}>
              Zurück zum Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center px-[var(--spacing-m)]" style={{ background: AUTH_GRADIENT }}>
        <div className="max-w-md w-full text-center">
          <p className="text-body text-foreground-600">Lädt...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

