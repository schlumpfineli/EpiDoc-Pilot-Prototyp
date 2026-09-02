"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Button, RadioGroup } from "@/components/ui";
import { authApi, apiClient } from "@/lib/api";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { EpiDocLogo } from "@/components/EpiDocLogo";
import { AUTH_GRADIENT, AUTH_LINK_CLASS, AUTH_BRAND_COLOR } from "@/lib/auth-constants";
import { extractApiError } from "@/lib/errorUtils";

const roles = [
  { id: "patient", label: "Patient" },
  { id: "angehoeriger", label: "Angehöriger" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "patient",
      privacyAccepted: false,
      healthDataConsent: false,
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterInput) => {
    try {
      setApiError(null);
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        role: data.role as "patient" | "relative",
        privacy_accepted: true,
        health_data_consent: true,
      });
      
      // Token speichern
      apiClient.setToken(response.token);
      
      // Event dispatchen, damit andere Komponenten (z.B. Navbar) den Auth-Status aktualisieren
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-changed"));
      }
      
      router.push('/diary');
    } catch (err) {
      setApiError(extractApiError(err, "Registrierung fehlgeschlagen. Bitte versuche es erneut."));
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
            Konto erstellen
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-[var(--spacing-l)]">
          <RadioGroup
            name="role"
            label="Rolle auswählen"
            options={roles.map((r) => ({
              value: r.id === "angehoeriger" ? "relative" : r.id,
              label: r.label,
            }))}
            value={selectedRole}
            onChange={(value) => setValue("role", value as "patient" | "relative")}
            error={errors.role?.message}
            layout="horizontal"
          />

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
            placeholder="Mindestens 8 Zeichen"
            autoComplete="new-password"
            {...register("password")}
            error={errors.password?.message}
            helperText="Mindestens 8 Zeichen, 1 Grossbuchstabe, 1 Kleinbuchstabe, 1 Zahl"
          />

          <div className="space-y-[var(--spacing-s)]">
            <label className="flex items-start gap-[var(--spacing-2xs)] cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                {...register("privacyAccepted")}
              />
              <span className="text-body-small text-foreground-700">
                Ich habe die{" "}
                <a href="/datenschutz" className={AUTH_LINK_CLASS} target="_blank" rel="noreferrer">
                  Datenschutzerklärung
                </a>{" "}
                gelesen und akzeptiere sie.
              </span>
            </label>
            {errors.privacyAccepted && (
              <p className="text-body-small text-warning-600" role="alert">
                {errors.privacyAccepted.message}
              </p>
            )}

            <label className="flex items-start gap-[var(--spacing-2xs)] cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                {...register("healthDataConsent")}
              />
              <span className="text-body-small text-foreground-700">
                Ich willige ausdrücklich in die Verarbeitung meiner Gesundheitsdaten
                (Anfälle, Befinden, Medikamente, Tagebuch) ein. Der Widerruf erfolgt
                durch Löschen des Kontos.
              </span>
            </label>
            {errors.healthDataConsent && (
              <p className="text-body-small text-warning-600" role="alert">
                {errors.healthDataConsent.message}
              </p>
            )}
          </div>

          {apiError && (
            <div className="rounded-lg border border-warning-200/60 bg-warning-50/50 px-[var(--spacing-m)] py-[var(--spacing-s)]">
              <p className="text-body-small text-warning-700">{apiError}</p>
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Lädt..." : "Registrieren"}
          </Button>
        </form>

        <p className="text-body text-center text-foreground-600 pt-[var(--spacing-xs)]">
          Bereits registriert?{" "}
          <a href="/login" className={AUTH_LINK_CLASS}>
            Zum Login wechseln
          </a>
        </p>
        <p className="text-body-small text-center text-foreground-500">
          <a href="/datenschutz" className={AUTH_LINK_CLASS}>Datenschutz</a>
          {" · "}
          <a href="/impressum" className={AUTH_LINK_CLASS}>Impressum</a>
        </p>
      </div>
    </div>
  );
}
