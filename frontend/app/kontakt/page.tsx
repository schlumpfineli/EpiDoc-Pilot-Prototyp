"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { feedbackApi, FeedbackData } from "@/lib/api";
import { toastService } from "@/components/ui";

export default function KontaktPage() {
  const [form, setForm] = useState<FeedbackData>({
    type: "other",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = (form.message || "").trim();
    if (trimmed.length < 10) {
      toastService.show(
        "Bitte schreiben Sie mindestens 10 Zeichen.",
        "error"
      );
      return;
    }
    try {
      setIsSubmitting(true);
      await feedbackApi.sendFeedback({
        ...form,
        message: trimmed,
      });
      toastService.show(
        "Nachricht wurde gesendet. Wir melden uns bei Ihnen.",
        "success"
      );
      setForm({ type: "other", message: "" });
    } catch (error: any) {
      console.error("Kontakt senden:", error);
      toastService.show(
        error?.message || "Nachricht konnte nicht gesendet werden.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen px-[var(--spacing-s)] sm:px-[var(--spacing-m)] md:px-[var(--spacing-l)] py-[var(--spacing-s)] md:py-[var(--spacing-m)] text-foreground-900" style={{ background: "#F2F6F4" }}>
        <div className="mx-auto max-w-xl">
          <h1 className="text-headline-3 font-semibold leading-tight tracking-tight text-center py-[var(--spacing-m)]">
            Kontakt
          </h1>
          <p className="text-body text-foreground-600 text-center mb-[var(--spacing-l)]">
            Haben Sie Fragen oder möchten Sie mit uns in Kontakt treten? Schreiben Sie uns eine Nachricht.
          </p>

          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm space-y-[var(--spacing-m)]"
          >
            <div>
              <label htmlFor="message" className="block text-body-small font-medium text-foreground-700 mb-[var(--spacing-2xs)]">
                Ihre Nachricht <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                required
                minLength={10}
                maxLength={2000}
                rows={6}
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Beschreiben Sie Ihr Anliegen (mind. 10 Zeichen)..."
                className="w-full rounded-xl border border-[#DDE7E2] bg-white px-4 py-2.5 text-body text-[#1F352D] placeholder:text-[#6B7C74] focus:border-[#3E7C67] focus:outline-none focus:ring-1 focus:ring-[#3E7C67]/20 resize-none"
              />
              <p className="text-body-small text-foreground-500 mt-[var(--spacing-2xs)]">
                {form.message.length} / 2000 Zeichen
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (form.message || "").trim().length < 10}
              className="w-full rounded-2xl bg-[#3E7C67] px-5 py-3.5 text-body font-medium text-white transition hover:bg-[#346B59] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Wird gesendet…" : "Nachricht senden"}
            </button>
          </form>

          <p className="text-body-small text-foreground-500 text-center mt-[var(--spacing-m)]">
            Ihre Nachricht wird an das EpiDoc-Pilot-Team übermittelt. Wir antworten so bald wie möglich.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
