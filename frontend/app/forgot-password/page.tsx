"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Input, Button } from "@/components/ui";
import { authApi } from "@/lib/api";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      setIsLoading(true);
      setApiError(null);
      setIsSuccess(false);
      
      const response = await authApi.forgotPassword(data);
      
      setIsSuccess(true);
      
      // In Development: Zeige Reset-URL direkt an
      if (response.reset_url) {
        setResetUrl(response.reset_url);
      }
    } catch (err: any) {
      setApiError(err.message || 'Fehler beim Anfordern des Passwort-Resets. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center px-[var(--spacing-m)] bg-[#F7F8F7]">
        <div className="max-w-md w-full space-y-[var(--spacing-xl)]">
          <div className="rounded-2xl bg-white border border-background-200/60 p-[var(--spacing-xl)] text-center space-y-[var(--spacing-l)]">
            <div className="mx-auto w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-[var(--spacing-m)]">
              <h1 className="text-h4 sm:text-h3 font-semibold text-foreground-900">
                E-Mail gesendet
              </h1>
              <p className="text-body text-foreground-700">
                {resetUrl 
                  ? 'Ein Passwort-Reset-Link wurde erstellt. In der Produktion würde dieser per E-Mail versendet werden. Für den Prototyp-Test können Sie den Link hier verwenden:'
                  : 'Wenn die E-Mail-Adresse existiert, wurde ein Reset-Link gesendet. Bitte überprüfen Sie Ihr Postfach.'}
              </p>
              {resetUrl && (
                <div className="mt-[var(--spacing-l)] space-y-[var(--spacing-m)]">
                  <div className="rounded-lg border border-info-200/60 bg-info-50/50 p-[var(--spacing-m)]">
                    <p className="text-body-small text-info-800 font-medium mb-[var(--spacing-xs)]">
                      ⚠️ Prototyp-Modus: Link wird direkt angezeigt
                    </p>
                    <p className="text-body-small text-info-700">
                      In der Produktion würde der Reset-Link per E-Mail versendet werden.
                    </p>
                  </div>
                  <div className="p-[var(--spacing-m)] bg-[#F7F8F7] rounded-lg border border-background-200/60">
                    <p className="text-body-small text-foreground-600 mb-[var(--spacing-s)] font-medium">
                      Reset-Link:
                    </p>
                    <a 
                      href={resetUrl} 
                      className="text-[#6FB48F] hover:text-[#5EA37E] text-body-small underline break-all block"
                    >
                      {resetUrl}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-[var(--spacing-s)]">
            <Link href="/login">
              <Button variant="primary" fullWidth>
                Zurück zum Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-[var(--spacing-m)] bg-[#F7F8F7]">
      <div className="max-w-md w-full space-y-[var(--spacing-xl)]">
        <div className="rounded-2xl bg-white border border-background-200/60 p-[var(--spacing-xl)] space-y-[var(--spacing-l)]">
          <div className="text-center space-y-[var(--spacing-m)]">
            <h1 className="text-h4 sm:text-h3 font-semibold text-foreground-900">
              Passwort vergessen?
            </h1>
            <p className="text-body text-foreground-600">
              Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[var(--spacing-l)]">
            {apiError && (
              <div className="rounded-lg border border-warning-200/60 bg-warning-50/50 p-[var(--spacing-m)]">
                <p className="text-body-small text-warning-700">{apiError}</p>
              </div>
            )}

          <div className="space-y-[var(--spacing-s)]">
            <Input
              label="E-Mail-Adresse"
              type="email"
              placeholder="ihre@email.com"
              error={errors.email?.message}
              {...register('email')}
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
              {isLoading ? 'Wird gesendet...' : 'Reset-Link anfordern'}
            </Button>
          </form>

          <div className="text-center pt-[var(--spacing-xs)]">
            <Link href="/login" className="text-body-small text-[#6FB48F] hover:text-[#5EA37E]">
              Zurück zum Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

