"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { medicationApi, Medication } from "@/lib/api";
import { toastService } from "@/components/ui";

const timeOfDayOptions = [
  { value: "morning", label: "Morgens" },
  { value: "noon", label: "Mittags" },
  { value: "evening", label: "Abends" },
  { value: "night", label: "Nachts" },
];

type MedicationFormData = {
  name: string;
  dose: string;
  time_of_day: string[];
  notes: string;
  prescribed_since: string;
};

const emptyForm: MedicationFormData = {
  name: "",
  dose: "",
  time_of_day: [],
  notes: "",
  prescribed_since: "",
};

type Tab = "active" | "inactive";

export default function MedikamentePage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("active");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MedicationFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscontinueModal, setShowDiscontinueModal] = useState<number | null>(null);
  const [discontinuationReason, setDiscontinuationReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setIsLoading(true);
      const response = await medicationApi.getAll();
      setMedications(response.data);
    } catch (error: any) {
      console.error("Fehler beim Laden der Medikamente:", error);
      toastService.show(
        error.message || "Fehler beim Laden der Medikamente",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const activeMeds = medications.filter((m) => m.active);
  const inactiveMeds = medications
    .filter((m) => !m.active)
    .sort((a, b) => {
      const dateA = a.discontinued_at ? new Date(a.discontinued_at).getTime() : 0;
      const dateB = b.discontinued_at ? new Date(b.discontinued_at).getTime() : 0;
      return dateB - dateA;
    });

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (med: Medication) => {
    setEditingId(med.id);
    setForm({
      name: med.name,
      dose: med.dose || "",
      time_of_day: med.time_of_day || [],
      notes: med.notes || "",
      prescribed_since: med.prescribed_since
        ? med.prescribed_since.split("T")[0]
        : "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const toggleTimeOfDay = (value: string) => {
    setForm((prev) => ({
      ...prev,
      time_of_day: prev.time_of_day.includes(value)
        ? prev.time_of_day.filter((t) => t !== value)
        : [...prev.time_of_day, value],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toastService.show("Bitte geben Sie den Medikamentennamen ein", "error");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: form.name.trim(),
        dose: form.dose.trim() || null,
        time_of_day: form.time_of_day.length > 0 ? form.time_of_day : null,
        notes: form.notes.trim() || null,
        prescribed_since: form.prescribed_since || null,
        active: true,
      };

      if (editingId) {
        await medicationApi.update(editingId, payload);
        toastService.show("Medikament aktualisiert", "success");
      } else {
        await medicationApi.create(payload as any);
        toastService.show("Medikament hinzugefügt", "success");
      }

      closeForm();
      await loadMedications();
    } catch (error: any) {
      console.error("Fehler beim Speichern:", error);
      toastService.show(
        error.message || "Fehler beim Speichern des Medikaments",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscontinue = async (id: number) => {
    try {
      setIsSaving(true);
      await medicationApi.update(id, {
        active: false,
        discontinued_at: new Date().toISOString().split("T")[0],
        discontinuation_reason: discontinuationReason.trim() || null,
      });
      toastService.show("Medikament abgesetzt", "success");
      setShowDiscontinueModal(null);
      setDiscontinuationReason("");
      await loadMedications();
    } catch (error: any) {
      console.error("Fehler:", error);
      toastService.show(error.message || "Fehler beim Absetzen", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      setIsSaving(true);
      await medicationApi.update(id, {
        active: true,
        discontinued_at: null,
        discontinuation_reason: null,
      });
      toastService.show("Medikament reaktiviert", "success");
      await loadMedications();
    } catch (error: any) {
      console.error("Fehler:", error);
      toastService.show(error.message || "Fehler beim Reaktivieren", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsSaving(true);
      await medicationApi.delete(id);
      toastService.show("Medikament gelöscht", "success");
      setShowDeleteConfirm(null);
      await loadMedications();
    } catch (error: any) {
      console.error("Fehler:", error);
      toastService.show(error.message || "Fehler beim Löschen", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimeOfDay = (times: string[] | null | undefined) => {
    if (!times || times.length === 0) return "—";
    return times
      .map((t) => timeOfDayOptions.find((o) => o.value === t)?.label || t)
      .join(", ");
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateRange = (med: Medication) => {
    const from = formatDate(med.prescribed_since);
    const to = formatDate(med.discontinued_at);
    if (from && to) return `${from} – ${to}`;
    if (from) return `Ab ${from}`;
    if (to) return `Bis ${to}`;
    return null;
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-body text-foreground-600">
            Lädt Medikamente...
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background-50 to-white px-[var(--spacing-s)] sm:px-[var(--spacing-m)] md:px-[var(--spacing-l)] lg:px-[var(--spacing-xl)] xl:px-[var(--spacing-2xl)] 2xl:px-[var(--spacing-3xl)] py-[var(--spacing-2xs)] sm:py-[var(--spacing-s)] md:py-[var(--spacing-m)] lg:py-[var(--spacing-l)] xl:py-[var(--spacing-xl)] 2xl:py-[var(--spacing-2xl)] text-foreground-900">
        <div className="mx-auto flex w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-[90rem] xl:max-w-[100rem] 2xl:max-w-[120rem] flex-col gap-[var(--spacing-s)] sm:gap-[var(--spacing-m)] md:gap-[var(--spacing-l)] lg:gap-[var(--spacing-xl)]">
          {/* Header */}
          <div className="space-y-[var(--spacing-s)]">
            <h1 className="text-headline-3 font-semibold leading-tight tracking-tight text-center py-[var(--spacing-m)] sm:py-[var(--spacing-l)] md:py-[var(--spacing-xl)]">
              Medikamente
            </h1>

            {/* Toggle */}
            <div className="flex rounded-xl bg-background-100 p-[3px]">
              <button
                type="button"
                onClick={() => setTab("active")}
                className={`flex-1 rounded-lg py-[var(--spacing-2xs)] text-body-small font-semibold transition ${
                  tab === "active"
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-foreground-500 hover:text-foreground-700"
                }`}
              >
                Aktuell
              </button>
              <button
                type="button"
                onClick={() => setTab("inactive")}
                className={`flex-1 rounded-lg py-[var(--spacing-2xs)] text-body-small font-semibold transition ${
                  tab === "inactive"
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-foreground-500 hover:text-foreground-700"
                }`}
              >
                Abgesetzt
              </button>
            </div>
          </div>

          {/* ===== TAB: Aktuelle Medikamente ===== */}
          {tab === "active" && (
            <>
              <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
                <div className="flex items-center justify-between mb-[var(--spacing-m)]">
                  <h2 className="text-h5 font-semibold text-foreground-900">
                    Aktuelle Medikamente
                  </h2>
                  <button
                    type="button"
                    onClick={openAddForm}
                    className="rounded-lg bg-primary-600 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body-small font-medium text-white shadow-sm transition hover:bg-primary-700"
                  >
                    + Hinzufügen
                  </button>
                </div>

                {activeMeds.length === 0 ? (
                  <p className="text-body-small text-foreground-600 py-[var(--spacing-m)] text-center">
                    Noch keine Medikamente erfasst.
                  </p>
                ) : (
                  <div className="space-y-[var(--spacing-s)]">
                    {activeMeds.map((med) => (
                      <div
                        key={med.id}
                        className="rounded-lg border border-background-200 p-[var(--spacing-m)] transition hover:border-primary-200"
                      >
                        <div className="flex items-start justify-between gap-[var(--spacing-s)]">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-body font-semibold text-foreground-900">
                              {med.name}
                            </h3>
                            <div className="mt-[var(--spacing-2xs)] space-y-[var(--spacing-3xs)]">
                              {med.dose && (
                                <p className="text-body-small text-foreground-600">
                                  <span className="font-medium">Dosierung:</span>{" "}
                                  {med.dose}
                                </p>
                              )}
                              <p className="text-body-small text-foreground-600">
                                <span className="font-medium">Einnahmezeit:</span>{" "}
                                {formatTimeOfDay(med.time_of_day)}
                              </p>
                              {med.prescribed_since && (
                                <p className="text-body-small text-foreground-600">
                                  <span className="font-medium">Seit:</span>{" "}
                                  {new Date(med.prescribed_since).toLocaleDateString("de-CH")}
                                </p>
                              )}
                              {med.notes && (
                                <p className="text-body-small text-foreground-500 italic">
                                  {med.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-[var(--spacing-2xs)] shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditForm(med)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-500 transition hover:bg-background-100 hover:text-primary-600"
                              aria-label="Bearbeiten"
                              title="Bearbeiten"
                            >
                              <svg className="h-[1.125rem] w-[1.125rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDiscontinueModal(med.id)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-500 transition hover:bg-background-100 hover:text-warning-500"
                              aria-label="Absetzen"
                              title="Absetzen"
                            >
                              <svg className="h-[1.125rem] w-[1.125rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== TAB: Abgesetzte Medikamente (Verlauf) ===== */}
          {tab === "inactive" && (
            <>
              {inactiveMeds.length === 0 ? (
                <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm text-center">
                  <p className="text-body text-foreground-600 py-[var(--spacing-m)]">
                    Noch keine abgesetzten Medikamente vorhanden.
                  </p>
                  <p className="text-body-small text-foreground-500">
                    Wenn Sie ein Medikament absetzen, wird es hier mit dem Einnahmezeitraum angezeigt.
                  </p>
                </div>
              ) : (
                <div className="space-y-[var(--spacing-s)]">
                  {inactiveMeds.map((med) => (
                    <div
                      key={med.id}
                      className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-[var(--spacing-s)]">
                        <div className="flex-1 min-w-0">
                          {/* Name und Dosierung */}
                          <h3 className="text-body font-semibold text-foreground-800">
                            {med.name}
                            {med.dose && (
                              <span className="font-normal text-foreground-600">
                                {" "}– {med.dose}
                              </span>
                            )}
                          </h3>

                          {/* Zeitraum */}
                          <div className="mt-[var(--spacing-2xs)]">
                            {formatDateRange(med) ? (
                              <div className="flex items-center gap-[var(--spacing-2xs)]">
                                <svg className="h-4 w-4 text-foreground-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-body-small font-medium text-foreground-700">
                                  {formatDateRange(med)}
                                </span>
                              </div>
                            ) : (
                              <p className="text-body-small text-foreground-400 italic">
                                Kein Zeitraum erfasst
                              </p>
                            )}
                          </div>

                          {/* Details */}
                          <div className="mt-[var(--spacing-2xs)] space-y-[var(--spacing-3xs)]">
                            {med.time_of_day && med.time_of_day.length > 0 && (
                              <p className="text-body-small text-foreground-500">
                                Einnahmezeit: {formatTimeOfDay(med.time_of_day)}
                              </p>
                            )}
                            {med.discontinuation_reason && (
                              <p className="text-body-small text-foreground-500">
                                <span className="font-medium">Absetzungsgrund:</span>{" "}
                                {med.discontinuation_reason}
                              </p>
                            )}
                            {med.notes && (
                              <p className="text-body-small text-foreground-500 italic">
                                {med.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Aktionen */}
                        <div className="flex gap-[var(--spacing-2xs)] shrink-0">
                          <button
                            type="button"
                            onClick={() => handleReactivate(med.id)}
                            disabled={isSaving}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-500 transition hover:bg-background-100 hover:text-accent-700 disabled:opacity-50"
                            aria-label="Reaktivieren"
                            title="Reaktivieren"
                          >
                            <svg className="h-[1.125rem] w-[1.125rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(med.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-500 transition hover:bg-background-100 hover:text-warning-500"
                            aria-label="Löschen"
                            title="Löschen"
                          >
                            <svg className="h-[1.125rem] w-[1.125rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Formular-Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-900/50 p-[var(--spacing-s)]">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-[var(--spacing-m)] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-[var(--spacing-m)]">
                <h2 className="text-body font-semibold text-foreground-900">
                  {editingId ? "Medikament bearbeiten" : "Neues Medikament"}
                </h2>
                <button
                  onClick={closeForm}
                  className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100"
                  aria-label="Schließen"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-[var(--spacing-m)]">
                {/* Name */}
                <div>
                  <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                    Medikamentenname <span className="text-warning-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="z.B. Levetiracetam"
                    className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>

                {/* Dosierung */}
                <div>
                  <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                    Dosierung
                  </label>
                  <input
                    type="text"
                    value={form.dose}
                    onChange={(e) => setForm({ ...form, dose: e.target.value })}
                    placeholder="z.B. 500mg"
                    className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>

                {/* Einnahmezeit */}
                <div>
                  <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                    Einnahmezeit
                  </label>
                  <div className="flex flex-wrap gap-[var(--spacing-2xs)]">
                    {timeOfDayOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleTimeOfDay(opt.value)}
                        className={`rounded-lg px-[var(--spacing-s)] py-[var(--spacing-3xs)] text-body-small font-medium transition ${
                          form.time_of_day.includes(opt.value)
                            ? "bg-primary-600 text-white"
                            : "border border-background-200 bg-white text-foreground-700 hover:bg-background-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Verschrieben seit */}
                <div>
                  <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                    Verschrieben seit
                  </label>
                  <input
                    type="date"
                    value={form.prescribed_since}
                    onChange={(e) =>
                      setForm({ ...form, prescribed_since: e.target.value })
                    }
                    className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>

                {/* Bemerkungen */}
                <div>
                  <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                    Bemerkungen
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    placeholder="Optionale Notizen..."
                    className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-[var(--spacing-m)] pt-[var(--spacing-s)]">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 rounded-lg border border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 rounded-lg bg-primary-600 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isSaving
                      ? "Speichert..."
                      : editingId
                        ? "Aktualisieren"
                        : "Speichern"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Absetzen-Modal */}
        {showDiscontinueModal !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-900/50 p-[var(--spacing-s)]">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-[var(--spacing-m)]">
              <div className="flex items-center justify-between mb-[var(--spacing-m)]">
                <h2 className="text-body font-semibold text-foreground-900">
                  Medikament absetzen
                </h2>
                <button
                  onClick={() => {
                    setShowDiscontinueModal(null);
                    setDiscontinuationReason("");
                  }}
                  className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100"
                  aria-label="Schließen"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-[var(--spacing-m)]">
                <p className="text-body text-foreground-700">
                  Möchten Sie dieses Medikament als abgesetzt markieren?
                </p>
                <div>
                  <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                    Grund für die Absetzung (optional)
                  </label>
                  <textarea
                    value={discontinuationReason}
                    onChange={(e) => setDiscontinuationReason(e.target.value)}
                    rows={3}
                    placeholder="z.B. Nebenwirkungen, Umstellung..."
                    className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
                  />
                </div>
                <div className="flex gap-[var(--spacing-m)] pt-[var(--spacing-s)]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDiscontinueModal(null);
                      setDiscontinuationReason("");
                    }}
                    className="flex-1 rounded-lg border border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDiscontinue(showDiscontinueModal)}
                    disabled={isSaving}
                    className="flex-1 rounded-lg bg-info-600 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-white shadow-sm transition hover:bg-info-700 disabled:opacity-50"
                  >
                    {isSaving ? "Speichert..." : "Absetzen"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Löschen-Bestätigung */}
        {showDeleteConfirm !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-900/50 p-[var(--spacing-s)]">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-[var(--spacing-m)]">
              <div className="flex items-center justify-between mb-[var(--spacing-m)]">
                <h2 className="text-body font-semibold text-foreground-900">
                  Medikament löschen
                </h2>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100"
                  aria-label="Schließen"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-[var(--spacing-m)]">
                <p className="text-body text-foreground-700">
                  Möchten Sie dieses Medikament endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <div className="flex gap-[var(--spacing-m)] pt-[var(--spacing-s)]">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 rounded-lg border border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(showDeleteConfirm)}
                    disabled={isSaving}
                    className="flex-1 rounded-lg bg-warning-500 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-white shadow-sm transition hover:bg-warning-600 disabled:opacity-50"
                  >
                    {isSaving ? "Löscht..." : "Endgültig löschen"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
