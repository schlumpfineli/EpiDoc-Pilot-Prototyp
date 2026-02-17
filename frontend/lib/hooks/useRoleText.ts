"use client";

import { useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { caregiverTexts } from "@/lib/roleTexts";

type RoleTextResult = {
  /** Gibt den rollenabhängigen Text zurück. Patient → Original, Angehöriger → Beobachterperspektive. */
  t: (patientText: string) => string;
  isCaregiver: boolean;
};

/**
 * Hook für rollenbasierte Texte.
 *
 * Verwendung:
 *   const { t } = useRoleText();
 *   <h1>{t("Wie geht es dir?")}</h1>
 */
export function useRoleText(): RoleTextResult {
  const { user } = useAuth();
  const isCaregiver = user?.role === "relative";

  const t = useCallback(
    (patientText: string): string => {
      if (!isCaregiver) return patientText;
      return caregiverTexts[patientText] ?? patientText;
    },
    [isCaregiver]
  );

  return { t, isCaregiver };
}
