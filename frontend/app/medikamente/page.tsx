"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { medicationApi, Medication } from "@/lib/api";
import { toastService } from "@/components/ui";

// ─── Constants ───────────────────────────────────────────────────────────────

const TIME_OPTIONS = [
  { value: "morning", label: "Morgens" },
  { value: "noon", label: "Mittags" },
  { value: "evening", label: "Abends" },
  { value: "night", label: "Nachts" },
] as const;

type Tab = "active" | "inactive";

type MedicationFormData = {
  name: string;
  dose: string;
  time_of_day: string[];
  notes: string;
  prescribed_since: string;
};

const EMPTY_FORM: MedicationFormData = {
  name: "",
  dose: "",
  time_of_day: [],
  notes: "",
  prescribed_since: "",
};

// ─── Design Tokens ───────────────────────────────────────────────────────────

const S = {
  page: "#F3F7F5",
  card: "#FFFFFF",
  cardShadow: "0 4px 12px rgba(38, 70, 60, 0.06)",
  title: "#1E3F34",
  input:
    "w-full rounded-xl border border-[#DDE7E2] bg-white px-4 py-2.5 text-body text-[#1E3F34] placeholder:text-[#6E847A] focus:border-[#3E7C67] focus:outline-none focus:ring-1 focus:ring-[#3E7C67]/20",
  label: "block text-body-small font-medium text-foreground-500 mb-[var(--spacing-2xs)]",
  btnPrimary:
    "flex-1 rounded-2xl px-5 py-3.5 text-body font-medium text-white transition disabled:opacity-50",
  btnPrimaryGradient: "linear-gradient(180deg, #3F7A63 0%, #356B58 100%)",
  btnSecondary:
    "flex-1 rounded-2xl border border-[#9FB8AE] bg-transparent px-5 py-3.5 text-body font-medium text-[#1E3F34] transition hover:bg-[#EEF4F1]",
  iconBtn:
    "flex h-8 w-8 items-center justify-center rounded-lg text-foreground-400 transition",
  closeBtn:
    "flex h-8 w-8 items-center justify-center rounded-lg text-foreground-400 transition hover:bg-background-100 hover:text-foreground-700",
  tabActive: "bg-[#3F7A63] text-white",
  tabInactive: "bg-transparent text-[#3F5F53] hover:text-[#1E3F34]",
  chipActive: "bg-[#B7D9C8] border border-[#9FC5B2] text-[#1E3F34] font-semibold",
  chipInactive:
    "bg-[#EEF4F1] border border-transparent text-[#7A9088] font-medium hover:bg-[#E4F2EC] hover:text-[#4F6B63]",
} as const;

// ─── Icons ───────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ReactivateIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// ─── Small Components ────────────────────────────────────────────────────────

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between mb-[var(--spacing-m)]">
      <h2 className="text-body font-medium" style={{ color: S.title }}>{title}</h2>
      <button onClick={onClose} className={S.closeBtn} aria-label="Schliessen"><CloseIcon /></button>
    </div>
  );
}

function ModalActions({ onCancel, onConfirm, confirmLabel, confirmingLabel, isSaving, disabled, variant = "primary" }: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmingLabel: string;
  isSaving: boolean;
  disabled?: boolean;
  variant?: "primary" | "danger" | "info";
}) {
  const variantClass =
    variant === "danger"
      ? "flex-1 rounded-2xl bg-warning-500 px-5 py-3.5 text-body font-medium text-white transition hover:bg-warning-600 disabled:opacity-50"
      : variant === "info"
        ? "flex-1 rounded-2xl bg-info-500 px-5 py-3.5 text-body font-medium text-white transition hover:bg-info-600 disabled:opacity-50"
        : S.btnPrimary;

  return (
    <div className="flex gap-[var(--spacing-m)] pt-[var(--spacing-s)]">
      <button type="button" onClick={onCancel} className={S.btnSecondary}>Abbrechen</button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isSaving || disabled}
        className={variantClass}
        style={variant === "primary" ? { background: S.btnPrimaryGradient } : undefined}
      >
        {isSaving ? confirmingLabel : confirmLabel}
      </button>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl py-[var(--spacing-2xs)] text-body-small font-medium transition ${active ? S.tabActive : S.tabInactive}`}
    >
      {children}
    </button>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={S.label}>
        {label}{required && <span className="text-[#4F6B63]"> *</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTimeOfDay = (times: string[] | null | undefined): string => {
  if (!times || times.length === 0) return "—";
  return times
    .map((t) => TIME_OPTIONS.find((o) => o.value === t)?.label || t)
    .join(", ");
};

const formatDate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateRange = (med: Medication): string | null => {
  const from = formatDate(med.prescribed_since);
  const to = formatDate(med.discontinued_at);
  if (from && to) return `${from} – ${to}`;
  if (from) return `Ab ${from}`;
  if (to) return `Bis ${to}`;
  return null;
};

async function withSaving(
  setIsSaving: (v: boolean) => void,
  action: () => Promise<void>,
  errorMsg: string,
): Promise<void> {
  try {
    setIsSaving(true);
    await action();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : errorMsg;
    console.error(errorMsg, error);
    toastService.show(message, "error");
  } finally {
    setIsSaving(false);
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MedikamentePage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("active");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MedicationFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscontinueModal, setShowDiscontinueModal] = useState<number | null>(null);
  const [discontinuationReason, setDiscontinuationReason] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const loadMedications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await medicationApi.getAll();
      setMedications(response.data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Fehler beim Laden der Medikamente";
      console.error("Fehler beim Laden der Medikamente:", error);
      toastService.show(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadMedications(); }, [loadMedications]);

  const activeMeds = medications.filter((m) => m.active);
  const inactiveMeds = medications
    .filter((m) => !m.active)
    .sort((a, b) => {
      const dateA = a.discontinued_at ? new Date(a.discontinued_at).getTime() : 0;
      const dateB = b.discontinued_at ? new Date(b.discontinued_at).getTime() : 0;
      return dateB - dateA;
    });

  // ─── Form Handlers ───────────────────────────────────────────────────────

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
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
    setForm(EMPTY_FORM);
  };

  const toggleTimeOfDay = (value: string) => {
    setForm((prev) => ({
      ...prev,
      time_of_day: prev.time_of_day.includes(value)
        ? prev.time_of_day.filter((t) => t !== value)
        : [...prev.time_of_day, value],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toastService.show("Bitte geben Sie den Medikamentennamen ein", "error");
      return;
    }

    const payload = {
      name: form.name.trim(),
      dose: form.dose.trim() || null,
      time_of_day: form.time_of_day.length > 0 ? form.time_of_day : null,
      notes: form.notes.trim() || null,
      prescribed_since: form.prescribed_since || null,
      active: true,
    };

    withSaving(setIsSaving, async () => {
      if (editingId) {
        await medicationApi.update(editingId, payload);
        toastService.show("Medikament aktualisiert", "success");
      } else {
        await medicationApi.create(payload as any);
        toastService.show("Medikament hinzugefügt", "success");
      }
      closeForm();
      await loadMedications();
    }, "Fehler beim Speichern des Medikaments");
  };

  const handleDiscontinue = (id: number) => {
    withSaving(setIsSaving, async () => {
      await medicationApi.update(id, {
        active: false,
        discontinued_at: new Date().toISOString().split("T")[0],
        discontinuation_reason: discontinuationReason.trim() || null,
      });
      toastService.show("Medikament abgesetzt", "success");
      setShowDiscontinueModal(null);
      setDiscontinuationReason("");
      await loadMedications();
    }, "Fehler beim Absetzen");
  };

  const handleReactivate = (id: number) => {
    withSaving(setIsSaving, async () => {
      await medicationApi.update(id, {
        active: true,
        discontinued_at: null,
        discontinuation_reason: null,
      });
      toastService.show("Medikament reaktiviert", "success");
      await loadMedications();
    }, "Fehler beim Reaktivieren");
  };

  const handleDeleteMed = (id: number) => {
    withSaving(setIsSaving, async () => {
      await medicationApi.delete(id);
      toastService.show("Medikament gelöscht", "success");
      setShowDeleteConfirm(null);
      await loadMedications();
    }, "Fehler beim Löschen");
  };

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-body text-foreground-600">Lädt Medikamente...</div>
        </div>
      </ProtectedRoute>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen pb-20 xl:pb-0 px-[var(--spacing-s)] sm:px-[var(--spacing-m)] md:px-[var(--spacing-l)] lg:px-[var(--spacing-xl)] xl:px-[var(--spacing-2xl)] 2xl:px-[var(--spacing-3xl)] py-[var(--spacing-2xs)] sm:py-[var(--spacing-s)] md:py-[var(--spacing-m)] lg:py-[var(--spacing-l)] xl:py-[var(--spacing-xl)] 2xl:py-[var(--spacing-2xl)] text-foreground-900"
        style={{ background: S.page }}
      >
        <div className="mx-auto flex w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-[90rem] xl:max-w-[100rem] 2xl:max-w-[120rem] flex-col gap-[var(--spacing-s)] sm:gap-[var(--spacing-m)] md:gap-[var(--spacing-l)] lg:gap-[var(--spacing-xl)]">

          {/* Header */}
          <div className="space-y-[var(--spacing-s)]">
            <h1
              className="text-headline-4 sm:text-headline-3 font-semibold leading-tight tracking-tight text-center py-[var(--spacing-m)] sm:py-[var(--spacing-l)] md:py-[var(--spacing-xl)]"
              style={{ color: S.title }}
            >
              Medikamente
            </h1>

            <div className="flex rounded-2xl bg-[#E7EEEB] p-[3px]">
              <TabButton active={tab === "active"} onClick={() => setTab("active")}>Aktuell</TabButton>
              <TabButton active={tab === "inactive"} onClick={() => setTab("inactive")}>Abgesetzt</TabButton>
            </div>
          </div>

          {/* ── Active Medications ── */}
          {tab === "active" && (
            <>
              <div className="flex items-center justify-between mb-[var(--spacing-m)]">
                <h2 className="section-label">Aktuelle Medikamente</h2>
                <button type="button" onClick={openAddForm} className="flex items-center gap-[3px] text-[13px] text-[#3E7C67] hover:text-[#346B59] transition">
                  <PlusIcon /> Hinzufügen
                </button>
              </div>

              {activeMeds.length === 0 ? (
                <div className="rounded-2xl py-[var(--spacing-l)] text-center" style={{ background: S.card, boxShadow: S.cardShadow }}>
                  <p className="text-body-small text-foreground-400">Noch keine Medikamente erfasst.</p>
                </div>
              ) : (
                <div className="rounded-2xl divide-y divide-background-200/40" style={{ background: S.card, boxShadow: S.cardShadow }}>
                  {activeMeds.map((med) => (
                    <div key={med.id} className="px-[var(--spacing-m)] py-[var(--spacing-s)] first:rounded-t-2xl last:rounded-b-2xl transition hover:bg-background-50/50">
                      <div className="flex items-start justify-between gap-[var(--spacing-s)]">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-body font-medium text-foreground-900">
                            {med.name}
                            {med.dose && <span className="font-normal text-foreground-500 ml-[var(--spacing-2xs)]">{med.dose}</span>}
                          </h3>
                          <div className="mt-[var(--spacing-3xs)] flex flex-wrap items-center gap-x-[var(--spacing-s)] gap-y-[var(--spacing-3xs)]">
                            <span className="text-body-small text-foreground-500">{formatTimeOfDay(med.time_of_day)}</span>
                            {med.prescribed_since && (
                              <span className="text-body-small text-foreground-400">seit {new Date(med.prescribed_since).toLocaleDateString("de-CH")}</span>
                            )}
                          </div>
                          {med.notes && <p className="text-body-small text-foreground-400 mt-[var(--spacing-3xs)]">{med.notes}</p>}
                        </div>
                        <div className="flex items-center gap-[var(--spacing-2xs)] shrink-0">
                          <button type="button" onClick={() => openEditForm(med)} className={`${S.iconBtn} hover:text-[#346B59] hover:bg-[#D6EAE2]`} aria-label="Bearbeiten" title="Bearbeiten">
                            <EditIcon />
                          </button>
                          <button type="button" onClick={() => setShowDiscontinueModal(med.id)} className={`${S.iconBtn} hover:text-warning-600 hover:bg-warning-50`} aria-label="Absetzen" title="Absetzen">
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Inactive Medications ── */}
          {tab === "inactive" && (
            <>
              {inactiveMeds.length === 0 ? (
                <div className="rounded-2xl py-[var(--spacing-l)] text-center" style={{ background: S.card, boxShadow: S.cardShadow }}>
                  <p className="text-body-small text-foreground-400">Noch keine abgesetzten Medikamente.</p>
                </div>
              ) : (
                <div className="rounded-2xl divide-y divide-background-200/40" style={{ background: S.card, boxShadow: S.cardShadow }}>
                  {inactiveMeds.map((med) => (
                    <div key={med.id} className="px-[var(--spacing-m)] py-[var(--spacing-s)] first:rounded-t-2xl last:rounded-b-2xl">
                      <div className="flex items-start justify-between gap-[var(--spacing-s)]">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-body font-medium text-foreground-700">
                            {med.name}
                            {med.dose && <span className="font-normal text-foreground-400 ml-[var(--spacing-2xs)]">{med.dose}</span>}
                          </h3>
                          <div className="mt-[var(--spacing-3xs)] flex flex-wrap items-center gap-x-[var(--spacing-s)] gap-y-[var(--spacing-3xs)]">
                            {formatDateRange(med) && <span className="text-body-small text-foreground-500">{formatDateRange(med)}</span>}
                            {med.time_of_day && med.time_of_day.length > 0 && (
                              <span className="text-body-small text-foreground-400">{formatTimeOfDay(med.time_of_day)}</span>
                            )}
                          </div>
                          {med.discontinuation_reason && (
                            <p className="text-body-small text-foreground-400 mt-[var(--spacing-3xs)]">Grund: {med.discontinuation_reason}</p>
                          )}
                          {med.notes && <p className="text-body-small text-foreground-400 mt-[var(--spacing-3xs)]">{med.notes}</p>}
                        </div>
                        <div className="flex items-center gap-[var(--spacing-2xs)] shrink-0">
                          <button type="button" onClick={() => handleReactivate(med.id)} disabled={isSaving} className={`${S.iconBtn} hover:text-[#346B59] hover:bg-[#D6EAE2] disabled:opacity-50`} aria-label="Reaktivieren" title="Reaktivieren">
                            <ReactivateIcon />
                          </button>
                          <button type="button" onClick={() => setShowDeleteConfirm(med.id)} className={`${S.iconBtn} hover:text-warning-600 hover:bg-warning-50`} aria-label="Löschen" title="Löschen">
                            <TrashIcon />
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

        {/* ── Form Modal ── */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal-container max-w-md px-[var(--spacing-l)] py-[var(--spacing-m)] overflow-y-auto">
              <ModalHeader
                title={editingId ? "Medikament bearbeiten" : "Neues Medikament"}
                onClose={closeForm}
              />

              <div className="space-y-[var(--spacing-m)]">
                <div className="flex gap-[var(--spacing-s)]">
                  <div className="flex-[2]">
                    <FormField label="Medikament" required>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="z.B. Levetiracetam"
                        className={S.input}
                      />
                      {!form.name.trim() && <p className="mt-1 text-[12px] text-[#7A9088]">Dieses Feld ist erforderlich.</p>}
                    </FormField>
                  </div>
                  <div className="flex-1">
                    <FormField label="Dosierung">
                      <input
                        type="text"
                        value={form.dose}
                        onChange={(e) => setForm({ ...form, dose: e.target.value })}
                        placeholder="500mg"
                        className={S.input}
                      />
                    </FormField>
                  </div>
                </div>

                <FormField label="Einnahmezeit">
                  <div className="flex flex-wrap gap-[var(--spacing-2xs)]">
                    {TIME_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleTimeOfDay(opt.value)}
                        className={`rounded-full px-[var(--spacing-xs)] py-[var(--spacing-3xs)] text-body-small transition ${
                          form.time_of_day.includes(opt.value) ? S.chipActive : S.chipInactive
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </FormField>

                <FormField label="Verschrieben seit">
                  <input
                    type="date"
                    value={form.prescribed_since}
                    onChange={(e) => setForm({ ...form, prescribed_since: e.target.value })}
                    className={S.input}
                  />
                </FormField>

                <FormField label="Bemerkungen">
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    placeholder="Optionale Notizen..."
                    className={`${S.input} resize-none`}
                  />
                </FormField>

                <ModalActions
                  onCancel={closeForm}
                  onConfirm={handleSave}
                  confirmLabel={editingId ? "Aktualisieren" : "Speichern"}
                  confirmingLabel="Speichert..."
                  isSaving={isSaving}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Discontinue Modal ── */}
        {showDiscontinueModal !== null && (
          <div className="modal-overlay">
            <div className="modal-container max-w-md p-[var(--spacing-m)]">
              <ModalHeader
                title="Medikament absetzen"
                onClose={() => { setShowDiscontinueModal(null); setDiscontinuationReason(""); }}
              />
              <div className="space-y-[var(--spacing-m)]">
                <p className="text-body text-foreground-700">
                  Möchten Sie dieses Medikament als abgesetzt markieren?
                </p>
                <FormField label="Grund für die Absetzung (optional)">
                  <textarea
                    value={discontinuationReason}
                    onChange={(e) => setDiscontinuationReason(e.target.value)}
                    rows={3}
                    placeholder="z.B. Nebenwirkungen, Umstellung..."
                    className={`${S.input} resize-none`}
                  />
                </FormField>
                <ModalActions
                  onCancel={() => { setShowDiscontinueModal(null); setDiscontinuationReason(""); }}
                  onConfirm={() => handleDiscontinue(showDiscontinueModal)}
                  confirmLabel="Absetzen"
                  confirmingLabel="Speichert..."
                  isSaving={isSaving}
                  variant="info"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Confirmation Modal ── */}
        {showDeleteConfirm !== null && (
          <div className="modal-overlay">
            <div className="modal-container max-w-md p-[var(--spacing-m)]">
              <ModalHeader
                title="Medikament löschen"
                onClose={() => setShowDeleteConfirm(null)}
              />
              <div className="space-y-[var(--spacing-m)]">
                <p className="text-body text-foreground-700">
                  Möchten Sie dieses Medikament endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <ModalActions
                  onCancel={() => setShowDeleteConfirm(null)}
                  onConfirm={() => handleDeleteMed(showDeleteConfirm)}
                  confirmLabel="Endgültig löschen"
                  confirmingLabel="Löscht..."
                  isSaving={isSaving}
                  variant="danger"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
