"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useRoleText } from "@/lib/hooks/useRoleText";

export default function DiaryHubPage() {
  const { t } = useRoleText();

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen pb-20 xl:pb-0 text-foreground-900"
        style={{ background: "#F2F6F4" }}
      >
        <div
          className="content-shell mx-auto w-full max-w-4xl px-4 py-[var(--spacing-s)] sm:px-6 sm:py-[var(--spacing-m)] md:py-[var(--spacing-l)] lg:px-8"
          style={{ width: "100%", maxWidth: "56rem" }}
        >
        <div className="flex flex-col gap-[var(--spacing-m)] sm:gap-[var(--spacing-l)]">
          <h1
            className="text-h4 sm:text-h3 font-semibold leading-tight tracking-tight text-center pt-[var(--spacing-s)] pb-[var(--spacing-2xs)]"
            style={{ color: "#1E3F34" }}
          >
            Tagebuch
          </h1>
          <p className="text-center text-[13px] text-[#7A9088]">
            {t("Wähle, was du festhalten möchtest – Anfälle oder freie Gedanken.")}
          </p>

          <div className="flex flex-col gap-[var(--spacing-s)]">
            <Link
              href="/diary/anfaelle"
              className="rounded-2xl p-[var(--spacing-m)] transition hover:shadow-[0_4px_12px_rgba(38,70,60,0.08)]"
              style={{ background: "#FFFFFF" }}
            >
              <h2 className="text-[15px] font-medium text-[#1E3F34]">
                Anfallstagebuch
              </h2>
              <p className="mt-0.5 text-[12px] text-[#9AADA5]">
                {t("Anfälle, Dauer und Notfallmedikamente dokumentieren.")}
              </p>
            </Link>

            <Link
              href="/diary/gedanken"
              className="rounded-2xl p-[var(--spacing-m)] transition hover:shadow-[0_4px_12px_rgba(38,70,60,0.08)]"
              style={{ background: "#FFFFFF" }}
            >
              <h2 className="text-[15px] font-medium text-[#1E3F34]">
                Gedankentagebuch
              </h2>
              <p className="mt-0.5 text-[12px] text-[#9AADA5]">
                {t("Eigene Gedanken frei festhalten – ohne Vorgaben.")}
              </p>
            </Link>
          </div>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
