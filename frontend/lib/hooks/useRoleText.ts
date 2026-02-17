"use client";

import { useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { caregiverTexts } from "@/lib/roleTexts";

/**
 * Hook für rollenbasierte Texte.
 *
 * Gibt eine Funktion `t(text)` zurück:
 * - Patient  → gibt den Original-Text unverändert zurück.
 * - Angehöriger → gibt die Beobachterperspektive zurück (falls vorhanden).
 *
 * Verwendung:
 *   const { t } = useRoleText();
 *   <h1>{t("Wie geht es dir?")}</h1>
 */
export function useRoleText() {
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
