"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useRoleText } from "@/lib/hooks/useRoleText";

export default function DiaryHubPage() {
  const { t } = useRoleText();

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen pb-20 xl:pb-0 px-[var(--spacing-s)] sm:px-[var(--spacing-m)] md:px-[var(--spacing-l)] py-[var(--spacing-s)] sm:py-[var(--spacing-m)] md:py-[var(--spacing-l)] text-foreground-900"
        style={{ background: "#F2F6F4" }}
      >
        <div className="mx-auto flex w-full max-w-sm sm:max-w-2xl flex-col gap-[var(--spacing-m)] sm:gap-[var(--spacing-l)]">
          <h1
            className="text-h4 sm:text-h3 font-semibold leading-tight tracking-tight text-center pt-[var(--spacing-s)] pb-[var(--spacing-2xs)]"
            style={{ color: "#1E3F34" }}
          >
            Tagebuch
          </h1>
          <p className="text-body text-center text-[#4F6A5F]">
            {t("Wähle, was du festhalten möchtest – Anfälle oder freie Gedanken.")}
          </p>

          <Link
            href="/diary/anfaelle"
            className="rounded-2xl p-[var(--spacing-m)] transition hover:shadow-[0_4px_12px_rgba(38,70,60,0.08)]"
            style={{ background: "#FFFFFF" }}
          >
            <h2 className="text-h5 font-semibold" style={{ color: "#1E3F34" }}>
              Anfallstagebuch
            </h2>
            <p className="mt-1 text-body-small text-[#4F6A5F]">
              {t("Anfälle, Dauer und Notfallmedikamente dokumentieren.")}
            </p>
          </Link>

          <Link
            href="/diary/gedanken"
            className="rounded-2xl p-[var(--spacing-m)] transition hover:shadow-[0_4px_12px_rgba(38,70,60,0.08)]"
            style={{ background: "#FFFFFF" }}
          >
            <h2 className="text-h5 font-semibold" style={{ color: "#1E3F34" }}>
              Gedankentagebuch
            </h2>
            <p className="mt-1 text-body-small text-[#4F6A5F]">
              {t("Eigene Gedanken frei festhalten – ohne Vorgaben.")}
            </p>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
