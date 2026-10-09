"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DiarySwitcher } from "@/components/DiarySwitcher";
import { journalApi, JournalEntry } from "@/lib/api";
import { toastService } from "@/components/ui";
import { useRoleText } from "@/lib/hooks/useRoleText";

const MAX_BODY = 10000;

export default function GedankenTagebuchPage() {
  const { t } = useRoleText();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadEntries = useCallback(async () => {
    try {
      const response = await journalApi.getAll();
      setEntries(response.data);
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: string }).message)
          : "Einträge konnten nicht geladen werden.";
      toastService.show(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleCreate = async () => {
    const body = draft.trim();
    if (!body) {
      toastService.show(t("Bitte schreibe etwas, bevor du speicherst."), "warning");
      return;
    }

    try {
      setIsSaving(true);
      const response = await journalApi.create({ body });
      setEntries((prev) => [response.data, ...prev]);
      setDraft("");
      toastService.show("Eintrag gespeichert", "success");
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: string }).message)
          : "Speichern ist fehlgeschlagen.";
      toastService.show(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditDraft(entry.body);
  };

  const handleUpdate = async () => {
    if (editingId == null) return;
    const body = editDraft.trim();
    if (!body) {
      toastService.show(t("Bitte schreibe etwas, bevor du speicherst."), "warning");
      return;
    }

    try {
      setIsUpdating(true);
      const response = await journalApi.update(editingId, { body });
      setEntries((prev) => prev.map((e) => (e.id === editingId ? response.data : e)));
      setEditingId(null);
      setEditDraft("");
      toastService.show("Eintrag aktualisiert", "success");
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: string }).message)
          : "Aktualisieren ist fehlgeschlagen.";
      toastService.show(message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      await journalApi.delete(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setEditDraft("");
      }
      toastService.show("Eintrag gelöscht", "success");
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: string }).message)
          : "Löschen ist fehlgeschlagen.";
      toastService.show(message, "error");
    } finally {
      setDeletingId(null);
    }
  };

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
            Gedankentagebuch
          </h1>

          <DiarySwitcher />

          <div className="rounded-2xl p-[var(--spacing-m)]" style={{ background: "#FFFFFF" }}>
            <label htmlFor="journal-draft" className="sr-only">
              {t("Deine Gedanken")}
            </label>
            <textarea
              id="journal-draft"
              data-testid="journal-draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_BODY))}
              rows={8}
              placeholder={t("Schreib einfach, was dir durch den Kopf geht.")}
              className="w-full resize-y rounded-xl border border-[#DDE7E2] bg-white px-3 py-1.5 text-[13px] text-[#4F6B63] placeholder:text-[#9AADA5] focus:border-[#3E7C67] focus:outline-none focus:ring-1 focus:ring-[#3E7C67]/20"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[13px] text-[#7A9088]">
                {draft.length}/{MAX_BODY}
              </span>
              <button
                type="button"
                data-testid="journal-save"
                onClick={handleCreate}
                disabled={isSaving || !draft.trim()}
                className="rounded-full bg-[#3E7C67] px-4 py-1.5 text-[13px] font-medium text-white transition hover:bg-[#346B59] disabled:opacity-50"
              >
                {isSaving ? "Speichert…" : "Speichern"}
              </button>
            </div>
          </div>

          {isLoading ? (
            <p className="text-body text-center text-foreground-600">Lädt Einträge...</p>
          ) : entries.length === 0 ? (
            <p className="text-body text-center text-[#4F6A5F]">
              {t("Noch keine Einträge.")}
            </p>
          ) : (
            <ul className="flex flex-col gap-[var(--spacing-s)]">
              {entries.map((entry) => {
                const isEditing = editingId === entry.id;
                return (
                  <li
                    key={entry.id}
                    data-testid="journal-entry"
                    className="rounded-2xl p-[var(--spacing-m)]"
                    style={{ background: "#FFFFFF" }}
                  >
                    <p className="text-body-small text-[#7A9088] mb-2">
                      {format(parseISO(entry.created_at), "d. MMMM yyyy, HH:mm", { locale: de })}
                    </p>
                    {isEditing ? (
                      <>
                        <textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value.slice(0, MAX_BODY))}
                          rows={6}
                          className="w-full resize-y rounded-xl border border-[#DDE7E2] bg-white px-3 py-1.5 text-[13px] text-[#4F6B63] focus:border-[#3E7C67] focus:outline-none focus:ring-1 focus:ring-[#3E7C67]/20"
                        />
                        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditDraft("");
                            }}
                            className="rounded-full border border-[#DDE7E2] bg-white px-4 py-1.5 text-[13px] font-medium text-[#1E3F34] hover:bg-[#EEF4F1]"
                          >
                            Abbrechen
                          </button>
                          <button
                            type="button"
                            onClick={handleUpdate}
                            disabled={isUpdating || !editDraft.trim()}
                            className="rounded-full bg-[#3E7C67] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#346B59] disabled:opacity-50"
                          >
                            {isUpdating ? "Speichert…" : "Speichern"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-body whitespace-pre-wrap text-[#1F352D]">{entry.body}</p>
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(entry)}
                            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[#3F5F53] hover:bg-[#EEF4F1]"
                          >
                            Bearbeiten
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[#C94B4B] hover:bg-[#F8EEEE] disabled:opacity-50"
                          >
                            {deletingId === entry.id ? "Löscht…" : "Löschen"}
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
