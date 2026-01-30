"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { authApi, UserProfile } from "@/lib/api";
import { toastService } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";

/**
 * Profilseite – auf das Nötigste reduziert (Sicherheit).
 * Zeigt nur die User-ID (read-only). Rest → Einstellungen.
 */
export default function ProfilPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const response = await authApi.getUser();
        if (!cancelled) {
          setProfileData(response.user as UserProfile);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error("Fehler beim Laden des Profils:", error);
          toastService.show(
            error?.message || "Fehler beim Laden des Profils",
            "error"
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    if (user) load();
    return () => { cancelled = true; };
  }, [user]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-body text-foreground-600">Lädt Daten...</p>
        </div>
      </ProtectedRoute>
    );
  }

  const displayName =
    (profileData as UserProfile & { display_name?: string })?.display_name ??
    (profileData ? `User-${profileData.id}` : "—");

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background-50 to-white px-[var(--spacing-s)] sm:px-[var(--spacing-m)] py-[var(--spacing-m)] md:py-[var(--spacing-l)] text-foreground-900">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-[var(--spacing-l)]">
          <h1 className="text-headline-3 font-semibold leading-tight tracking-tight">
            Profil
          </h1>
          <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
            <p className="text-body-small font-medium text-foreground-600 mb-[var(--spacing-2xs)]">
              User-ID
            </p>
            <p className="text-body text-foreground-900">
              {displayName}
            </p>
          </div>
          <Link
            href="/einstellungen"
            className="rounded-lg bg-primary-600 px-[var(--spacing-m)] py-[var(--spacing-s)] text-center text-body font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            Einstellungen
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
