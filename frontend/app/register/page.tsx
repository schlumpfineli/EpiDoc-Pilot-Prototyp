"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Button, RadioGroup } from "@/components/ui";
import { authApi, apiClient } from "@/lib/api";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { EpiDocLogo } from "@/components/EpiDocLogo";

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
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterInput) => {
    try {
      setApiError(null);
      const response = await authApi.register({
        ...data,
        role: data.role as "patient" | "relative",
      });
      
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
        setApiError(err.message || 'Registrierung fehlgeschlagen. Bitte versuche es erneut.');
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background-50 to-white px-[var(--spacing-s)] sm:px-[var(--spacing-m)] md:px-[var(--spacing-l)] lg:px-[var(--spacing-xl)] py-[var(--spacing-s)] sm:py-[var(--spacing-l)] md:py-[var(--spacing-xl)] lg:py-[var(--spacing-2xl)] text-foreground-900">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto space-y-[var(--spacing-l)] sm:space-y-[var(--spacing-xl)] md:space-y-[var(--spacing-2xl)]">
        <div className="space-y-[var(--spacing-m)] text-center">
          <div className="flex items-center justify-center gap-[var(--spacing-xs)] mb-[var(--spacing-xs)]">
            <EpiDocLogo size={100} />
            <p className="text-headline-4 font-bold text-primary-600">EpiDoc</p>
          </div>
          <h1 className="text-headline-3 font-semibold leading-tight tracking-tight text-center py-[var(--spacing-m)] sm:py-[var(--spacing-l)] md:py-[var(--spacing-xl)]">
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
            label="Name"
            type="text"
            placeholder="Vor- und Nachname"
            {...register("name")}
            error={errors.name?.message}
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
            helperText="Mindestens 8 Zeichen, 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl"
          />

          {apiError && (
            <div className="rounded-lg border border-warning-200 bg-warning-50 px-[var(--spacing-m)] py-[var(--spacing-s)]">
              <p className="text-body-small text-warning-700">{apiError}</p>
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Lädt..." : "Registrieren"}
          </Button>
        </form>

        <p className="text-body text-center text-foreground-600">
          Bereits registriert?{" "}
          <a
            href="/login"
            className="font-medium text-primary-600 hover:text-primary-700 transition"
          >
            Zum Login wechseln
          </a>
        </p>
      </div>
    </div>
  );
}
