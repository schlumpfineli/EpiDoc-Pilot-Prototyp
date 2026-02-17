"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { profileApi, authApi, UserProfile } from "@/lib/api";
import { toastService } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRoleText } from "@/lib/hooks/useRoleText";

// ─── Types ───────────────────────────────────────────────────────────────────

type Diagnosis = { type: string };
type Doctor = { name: string; phone?: string; email?: string };
type Clinic = { name: string; phone?: string; address?: string };
type Pharmacy = { name: string; phone?: string; address?: string };
type EmergencyContact = {
  name: string;
  phone?: string;
  relationship?: string;
};

type ModalType =
  | "diagnoses"
  | "doctors"
  | "clinics"
  | "pharmacies"
  | "emergency_contact"
  | null;

// ─── Shared CSS Classes ──────────────────────────────────────────────────────

const CSS = {
  input:
    "w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition",
  btnCancel:
    "flex-1 rounded-lg border-2 border-background-200 bg-white px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50",
  btnSave:
    "flex-1 rounded-lg bg-primary-600 px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed",
  btnEdit:
    "px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium text-primary-600 hover:text-primary-700 border border-primary-300 hover:border-primary-400 rounded-lg transition",
  btnAdd:
    "px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition",
  btnAddDashed:
    "w-full rounded-lg border-2 border-dashed border-background-300 py-[var(--spacing-s)] text-body font-medium text-foreground-500 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center gap-[var(--spacing-2xs)]",
  btnDelete:
    "flex h-9 w-9 items-center justify-center rounded-lg text-foreground-500 transition hover:bg-background-100 hover:text-warning-500",
  btnClose:
    "flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100",
  entryCard:
    "rounded-lg border border-background-200 bg-background-25 p-[var(--spacing-s)] space-y-[var(--spacing-s)]",
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    return (error as { message: string }).message;
  }
  return fallback;
}

function useListHelpers<T extends Record<string, unknown>>(
  items: T[],
  setItems: (items: T[]) => void,
  defaultItem: T
) {
  return {
    add: () => setItems([...items, defaultItem]),
    remove: (i: number) => setItems(items.filter((_, idx) => idx !== i)),
    update: (i: number, field: keyof T, value: string) =>
      setItems(
        items.map((item, idx) =>
          idx === i ? { ...item, [field]: value } : item
        )
      ),
  };
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

interface IconProps {
  className?: string;
}

const IconUser = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const IconMedical = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
  </svg>
);

const IconStethoscope = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
  </svg>
);

const IconBuilding = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
  </svg>
);

const IconPills = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18a.94.94 0 0 0-.662.274.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525" />
  </svg>
);

const IconPhone = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);

const IconShield = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

const IconPlus = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const IconTrash = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const IconMail = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

const IconMapPin = ({ className = "w-4 h-4" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

const IconChevronDown = ({ className = "w-5 h-5" }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ─── Reusable UI Components ──────────────────────────────────────────────────

function ProfileCompletionBar({ percentage }: { percentage: number }) {
  return (
    <div className="space-y-[var(--spacing-2xs)]">
      <div className="flex items-center justify-between text-body-small">
        <span className="text-foreground-500">Profil-Vervollständigung</span>
        <span className="font-medium text-foreground-700 tabular-nums">{percentage}%</span>
      </div>
      <div className="h-2 bg-background-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            background: percentage === 100 ? "oklch(0.78 0.07 150)" : "oklch(0.30 0.04 250)",
          }}
        />
      </div>
    </div>
  );
}

function PrivacyNote() {
  return (
    <div className="flex items-center gap-[var(--spacing-xs)] rounded-xl bg-primary-50 border border-primary-100 px-[var(--spacing-s)] py-[var(--spacing-xs)]">
      <IconShield className="w-4 h-4 text-primary-400 shrink-0" />
      <p className="text-body-small text-foreground-600">Diese Daten sind nur für Sie sichtbar.</p>
    </div>
  );
}

function EmptyState({ message, onAdd, addLabel }: { message: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="flex flex-col items-center py-[var(--spacing-m)] gap-[var(--spacing-s)]">
      <p className="text-body-small text-foreground-400 italic text-center">{message}</p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-[var(--spacing-2xs)] rounded-xl border-2 border-dashed border-background-300 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-medium text-foreground-500 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 active:scale-[0.98]"
      >
        <IconPlus className="w-4 h-4" />
        {addLabel}
      </button>
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-background-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-[var(--spacing-m)] py-[var(--spacing-s)] bg-background-25 transition-colors hover:bg-background-100 cursor-pointer"
      >
        <div className="flex items-center gap-[var(--spacing-xs)] min-w-0">
          <span className="text-primary-400 shrink-0">{icon}</span>
          <h2 className="text-body font-semibold text-foreground-900 truncate">{title}</h2>
        </div>
        <span className={`text-foreground-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          <IconChevronDown className="w-5 h-5" />
        </span>
      </button>
      {isOpen && (
        <div className="border-t border-background-100">
          <div className="px-[var(--spacing-m)] py-[var(--spacing-m)]">{children}</div>
        </div>
      )}
    </div>
  );
}

function EntryCard({ name, details }: { name: string; details: { icon: ReactNode; text: string }[] }) {
  return (
    <div className="rounded-xl border border-background-200 bg-background-25 px-[var(--spacing-s)] py-[var(--spacing-xs)] space-y-[var(--spacing-3xs)]">
      <p className="text-body font-medium text-foreground-900 break-words">{name}</p>
      {details
        .filter((d) => d.text)
        .map((d, i) => (
          <div key={i} className="flex items-center gap-[var(--spacing-2xs)] text-foreground-500">
            <span className="shrink-0">{d.icon}</span>
            <span className="text-body-small break-all">{d.text}</span>
          </div>
        ))}
    </div>
  );
}

/** Inline-Modal im Diary-Stil (Overlay + Container + Header + Scroll-Body). */
function InlineModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-[var(--spacing-s)]">
      <div className="w-full max-h-[90vh] rounded-xl bg-white shadow-xl border border-primary-500 ring-2 ring-primary-200 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <div className="sticky top-0 flex items-center justify-between gap-[var(--spacing-s)] border-b border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-m)]">
            <h2 className="text-body font-semibold text-foreground-900">{title}</h2>
            <button type="button" onClick={onClose} className={CSS.btnClose} aria-label="Schließen">
              <CloseIcon />
            </button>
          </div>
          <div className="p-[var(--spacing-s)] space-y-[var(--spacing-s)]">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Label + Input im Diary-Stil. */
function FormField({ label, type = "text", value, onChange, placeholder }: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-[var(--spacing-xs)]">
      <label className="text-body font-medium text-foreground-800">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={CSS.input}
      />
    </div>
  );
}

/** Abbrechen + Speichern Button-Zeile. */
function ModalActions({ onCancel, onSave, isSaving }: { onCancel: () => void; onSave: () => void; isSaving: boolean }) {
  return (
    <div className="flex gap-[var(--spacing-m)] pt-[var(--spacing-s)]">
      <button type="button" onClick={onCancel} className={CSS.btnCancel}>Abbrechen</button>
      <button type="button" onClick={onSave} disabled={isSaving} className={CSS.btnSave}>
        {isSaving ? "Speichert..." : "Speichern"}
      </button>
    </div>
  );
}

/** Bearbeiten + optional Hinzufügen Buttons unter den Einträgen. */
function SectionActions({ onEdit, onAdd }: { onEdit: () => void; onAdd?: () => void }) {
  return (
    <div className="flex items-center gap-[var(--spacing-2xs)]">
      <button type="button" onClick={onEdit} className={CSS.btnEdit}>Bearbeiten</button>
      {onAdd && (
        <button type="button" onClick={onAdd} className={CSS.btnAdd}>+ Hinzufügen</button>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProfilPage() {
  const { user } = useAuth();
  const { t } = useRoleText();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // ── Form State ──
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    name: "",
    phone: "",
    relationship: "",
  });

  // ── Generic list helpers ──
  const diagnosisHelpers = useListHelpers(diagnoses, setDiagnoses, { type: "" });
  const doctorHelpers = useListHelpers(doctors, setDoctors, { name: "", phone: "", email: "" });
  const clinicHelpers = useListHelpers(clinics, setClinics, { name: "", phone: "", address: "" });
  const pharmacyHelpers = useListHelpers(pharmacies, setPharmacies, { name: "", phone: "", address: "" });

  // ── Data Loading ──
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getUser();
      const userData = response.user as UserProfile;
      setProfileData(userData);
      syncFormState(userData);
    } catch (error: unknown) {
      toastService.show(extractErrorMessage(error, "Fehler beim Laden des Profils"), "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [user, loadProfile]);

  function syncFormState(data: UserProfile): void {
    // diagnoses aus Backend-Array oder Fallback aus altem disease-String
    if (data.diagnoses && data.diagnoses.length > 0) {
      setDiagnoses(data.diagnoses.map((d) => ({ type: d.type })));
    } else if (data.disease) {
      setDiagnoses([{ type: data.disease }]);
    } else {
      setDiagnoses([]);
    }
    setDoctors(data.doctors || []);
    setClinics(data.clinics || []);
    setPharmacies(data.pharmacies || []);
    setEmergencyContact(data.emergency_contact || { name: "", phone: "", relationship: "" });
  }

  // ── Saving ──
  const saveSection = async (section: ModalType): Promise<void> => {
    if (!section) return;

    try {
      setIsSaving(true);
      let data: Partial<UserProfile> = {};

      switch (section) {
        case "diagnoses":
          data = { diagnoses: diagnoses.filter((d) => d.type.trim()) };
          break;
        case "doctors":
          data = { doctors: doctors.filter((d) => d.name.trim()) };
          break;
        case "clinics":
          data = { clinics: clinics.filter((c) => c.name.trim()) };
          break;
        case "pharmacies":
          data = { pharmacies: pharmacies.filter((p) => p.name.trim()) };
          break;
        case "emergency_contact":
          data = { emergency_contact: emergencyContact.name.trim() ? emergencyContact : undefined };
          break;
      }

      await profileApi.update(data);
      toastService.show("Profil aktualisiert", "success");
      setActiveModal(null);
      await loadProfile();
    } catch (error: unknown) {
      toastService.show(extractErrorMessage(error, "Fehler beim Speichern"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const openModal = (modal: ModalType): void => {
    if (profileData) syncFormState(profileData);
    setActiveModal(modal);
  };

  const closeModal = (): void => {
    if (profileData) syncFormState(profileData);
    setActiveModal(null);
  };

  // ── Profile Completion ──
  const completionPercentage = (() => {
    if (!profileData) return 0;
    const filled = [
      !!(profileData.diagnoses && profileData.diagnoses.length > 0) || !!profileData.disease,
      !!(profileData.doctors && profileData.doctors.length > 0),
      !!(profileData.clinics && profileData.clinics.length > 0),
      !!(profileData.pharmacies && profileData.pharmacies.length > 0),
      !!profileData.emergency_contact?.name,
    ].filter(Boolean).length;
    return Math.round((filled / 5) * 100);
  })();

  // ── Loading State ──
  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-[var(--spacing-s)]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-500" />
            <p className="text-body-small text-foreground-500">Profil wird geladen...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ── Page ──
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background-50 to-white px-[var(--spacing-s)] sm:px-[var(--spacing-m)] md:px-[var(--spacing-l)] lg:px-[var(--spacing-xl)] xl:px-[var(--spacing-2xl)] 2xl:px-[var(--spacing-3xl)] py-[var(--spacing-2xs)] sm:py-[var(--spacing-s)] md:py-[var(--spacing-m)] lg:py-[var(--spacing-l)] xl:py-[var(--spacing-xl)] 2xl:py-[var(--spacing-2xl)] text-foreground-900">
        <div className="mx-auto flex w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-[90rem] xl:max-w-[100rem] 2xl:max-w-[120rem] flex-col gap-[var(--spacing-s)] sm:gap-[var(--spacing-m)] md:gap-[var(--spacing-l)] lg:gap-[var(--spacing-xl)]">
          {/* ── Header ── */}
          <div className="space-y-[var(--spacing-2xs)]">
            <h1 className="text-headline-3 font-semibold leading-tight tracking-tight text-center py-[var(--spacing-m)] sm:py-[var(--spacing-l)] md:py-[var(--spacing-xl)]">{t("Mein Profil")}</h1>
            <ProfileCompletionBar percentage={completionPercentage} />
          </div>

          <div className="space-y-[var(--spacing-s)]">
            <PrivacyNote />

            {/* ── Diagnosen ── */}
            <SectionCard icon={<IconMedical className="w-5 h-5" />} title="Diagnose / Epilepsieform">
              {(profileData?.diagnoses && profileData.diagnoses.length > 0) || profileData?.disease ? (
                <div className="space-y-[var(--spacing-s)]">
                  {profileData?.diagnoses && profileData.diagnoses.length > 0 ? (
                    profileData.diagnoses.map((d, i) => (
                      <div key={i} className="rounded-xl border border-background-200 bg-background-25 px-[var(--spacing-s)] py-[var(--spacing-xs)]">
                        <p className="text-body text-foreground-800">{d.type}</p>
                      </div>
                    ))
                  ) : profileData?.disease ? (
                    <div className="rounded-xl border border-background-200 bg-background-25 px-[var(--spacing-s)] py-[var(--spacing-xs)]">
                      <p className="text-body text-foreground-800">{profileData.disease}</p>
                    </div>
                  ) : null}
                  <SectionActions onEdit={() => openModal("diagnoses")} onAdd={() => { openModal("diagnoses"); diagnosisHelpers.add(); }} />
                </div>
              ) : (
                <EmptyState message="Noch keine Diagnose erfasst" onAdd={() => openModal("diagnoses")} addLabel="Diagnose hinzufügen" />
              )}
            </SectionCard>

            {/* ── Ärzte ── */}
            <SectionCard icon={<IconStethoscope className="w-5 h-5" />} title="Behandelnde Ärzte">
              {profileData?.doctors && profileData.doctors.length > 0 ? (
                <div className="space-y-[var(--spacing-s)]">
                  {profileData.doctors.map((doc, i) => (
                    <EntryCard key={i} name={doc.name} details={[
                      { icon: <IconPhone className="w-3.5 h-3.5" />, text: doc.phone || "" },
                      { icon: <IconMail className="w-3.5 h-3.5" />, text: doc.email || "" },
                    ]} />
                  ))}
                  <SectionActions onEdit={() => openModal("doctors")} onAdd={() => { openModal("doctors"); doctorHelpers.add(); }} />
                </div>
              ) : (
                <EmptyState message="Noch keine Ärzte erfasst" onAdd={() => openModal("doctors")} addLabel="Arzt hinzufügen" />
              )}
            </SectionCard>

            {/* ── Kliniken ── */}
            <SectionCard icon={<IconBuilding className="w-5 h-5" />} title="Kliniken / Spitäler">
              {profileData?.clinics && profileData.clinics.length > 0 ? (
                <div className="space-y-[var(--spacing-s)]">
                  {profileData.clinics.map((clinic, i) => (
                    <EntryCard key={i} name={clinic.name} details={[
                      { icon: <IconPhone className="w-3.5 h-3.5" />, text: clinic.phone || "" },
                      { icon: <IconMapPin className="w-3.5 h-3.5" />, text: clinic.address || "" },
                    ]} />
                  ))}
                  <SectionActions onEdit={() => openModal("clinics")} onAdd={() => { openModal("clinics"); clinicHelpers.add(); }} />
                </div>
              ) : (
                <EmptyState message="Noch keine Kliniken erfasst" onAdd={() => openModal("clinics")} addLabel="Klinik hinzufügen" />
              )}
            </SectionCard>

            {/* ── Apotheken ── */}
            <SectionCard icon={<IconPills className="w-5 h-5" />} title="Apotheken">
              {profileData?.pharmacies && profileData.pharmacies.length > 0 ? (
                <div className="space-y-[var(--spacing-s)]">
                  {profileData.pharmacies.map((pharmacy, i) => (
                    <EntryCard key={i} name={pharmacy.name} details={[
                      { icon: <IconPhone className="w-3.5 h-3.5" />, text: pharmacy.phone || "" },
                      { icon: <IconMapPin className="w-3.5 h-3.5" />, text: pharmacy.address || "" },
                    ]} />
                  ))}
                  <SectionActions onEdit={() => openModal("pharmacies")} onAdd={() => { openModal("pharmacies"); pharmacyHelpers.add(); }} />
                </div>
              ) : (
                <EmptyState message="Noch keine Apotheken erfasst" onAdd={() => openModal("pharmacies")} addLabel="Apotheke hinzufügen" />
              )}
            </SectionCard>

            {/* ── Notfallkontakt ── */}
            <SectionCard icon={<IconPhone className="w-5 h-5" />} title="Notfallkontakt">
              {profileData?.emergency_contact?.name ? (
                <div className="space-y-[var(--spacing-s)]">
                  <div className="space-y-[var(--spacing-3xs)]">
                    <p className="text-body font-medium text-foreground-900">{profileData.emergency_contact.name}</p>
                    {profileData.emergency_contact.phone && (
                      <div className="flex items-center gap-[var(--spacing-2xs)] text-foreground-500">
                        <IconPhone className="w-3.5 h-3.5" />
                        <span className="text-body-small">{profileData.emergency_contact.phone}</span>
                      </div>
                    )}
                    {profileData.emergency_contact.relationship && (
                      <div className="flex items-center gap-[var(--spacing-2xs)] text-foreground-500">
                        <IconUser className="w-3.5 h-3.5" />
                        <span className="text-body-small">{profileData.emergency_contact.relationship}</span>
                      </div>
                    )}
                  </div>
                  <SectionActions onEdit={() => openModal("emergency_contact")} />
                </div>
              ) : (
                <EmptyState message="Noch kein Notfallkontakt erfasst" onAdd={() => openModal("emergency_contact")} addLabel="Notfallkontakt hinzufügen" />
              )}
            </SectionCard>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}

      {activeModal === "diagnoses" && (
        <InlineModal title="Diagnosen bearbeiten" onClose={closeModal}>
          {diagnoses.length === 0 && (
            <p className="text-body text-foreground-400 text-center py-[var(--spacing-s)]">Noch keine Diagnosen hinzugefügt.</p>
          )}
          {diagnoses.map((diag, i) => (
            <div key={i} className={CSS.entryCard}>
              <div className="flex items-center justify-between">
                <span className="text-body font-semibold text-foreground-700">Diagnose {i + 1}</span>
                <button type="button" onClick={() => diagnosisHelpers.remove(i)} className={CSS.btnDelete} aria-label={`Diagnose ${i + 1} entfernen`} title="Entfernen">
                  <IconTrash className="w-[1.125rem] h-[1.125rem]" />
                </button>
              </div>
              <FormField label="Bezeichnung" value={diag.type} onChange={(v) => diagnosisHelpers.update(i, "type", v)} placeholder="z.B. Fokale Epilepsie, Juvenile myoklonische Epilepsie..." />
            </div>
          ))}
          <button type="button" onClick={diagnosisHelpers.add} className={CSS.btnAddDashed}>
            <IconPlus className="w-4 h-4" /> Diagnose hinzufügen
          </button>
          <ModalActions onCancel={closeModal} onSave={() => saveSection("diagnoses")} isSaving={isSaving} />
        </InlineModal>
      )}

      {activeModal === "doctors" && (
        <InlineModal title="Ärzte bearbeiten" onClose={closeModal}>
          {doctors.length === 0 && (
            <p className="text-body text-foreground-400 text-center py-[var(--spacing-s)]">Noch keine Ärzte hinzugefügt.</p>
          )}
          {doctors.map((doc, i) => (
            <div key={i} className={CSS.entryCard}>
              <div className="flex items-center justify-between">
                <span className="text-body font-semibold text-foreground-700">Arzt {i + 1}</span>
                <button type="button" onClick={() => doctorHelpers.remove(i)} className={CSS.btnDelete} aria-label={`Arzt ${i + 1} entfernen`} title="Entfernen">
                  <IconTrash className="w-[1.125rem] h-[1.125rem]" />
                </button>
              </div>
              <FormField label="Name" value={doc.name} onChange={(v) => doctorHelpers.update(i, "name", v)} placeholder="Name des Arztes" />
              <FormField label="Telefon" type="tel" value={doc.phone || ""} onChange={(v) => doctorHelpers.update(i, "phone", v)} placeholder="Telefonnummer" />
              <FormField label="E-Mail" type="email" value={doc.email || ""} onChange={(v) => doctorHelpers.update(i, "email", v)} placeholder="E-Mail-Adresse" />
            </div>
          ))}
          <button type="button" onClick={doctorHelpers.add} className={CSS.btnAddDashed}>
            <IconPlus className="w-4 h-4" /> Arzt hinzufügen
          </button>
          <ModalActions onCancel={closeModal} onSave={() => saveSection("doctors")} isSaving={isSaving} />
        </InlineModal>
      )}

      {activeModal === "clinics" && (
        <InlineModal title="Kliniken bearbeiten" onClose={closeModal}>
          {clinics.length === 0 && (
            <p className="text-body text-foreground-400 text-center py-[var(--spacing-s)]">Noch keine Kliniken hinzugefügt.</p>
          )}
          {clinics.map((clinic, i) => (
            <div key={i} className={CSS.entryCard}>
              <div className="flex items-center justify-between">
                <span className="text-body font-semibold text-foreground-700">Klinik {i + 1}</span>
                <button type="button" onClick={() => clinicHelpers.remove(i)} className={CSS.btnDelete} aria-label={`Klinik ${i + 1} entfernen`} title="Entfernen">
                  <IconTrash className="w-[1.125rem] h-[1.125rem]" />
                </button>
              </div>
              <FormField label="Name" value={clinic.name} onChange={(v) => clinicHelpers.update(i, "name", v)} placeholder="Name der Klinik" />
              <FormField label="Telefon" type="tel" value={clinic.phone || ""} onChange={(v) => clinicHelpers.update(i, "phone", v)} placeholder="Telefonnummer" />
              <FormField label="Adresse" value={clinic.address || ""} onChange={(v) => clinicHelpers.update(i, "address", v)} placeholder="Strasse und Ort" />
            </div>
          ))}
          <button type="button" onClick={clinicHelpers.add} className={CSS.btnAddDashed}>
            <IconPlus className="w-4 h-4" /> Klinik hinzufügen
          </button>
          <ModalActions onCancel={closeModal} onSave={() => saveSection("clinics")} isSaving={isSaving} />
        </InlineModal>
      )}

      {activeModal === "pharmacies" && (
        <InlineModal title="Apotheken bearbeiten" onClose={closeModal}>
          {pharmacies.length === 0 && (
            <p className="text-body text-foreground-400 text-center py-[var(--spacing-s)]">Noch keine Apotheken hinzugefügt.</p>
          )}
          {pharmacies.map((pharmacy, i) => (
            <div key={i} className={CSS.entryCard}>
              <div className="flex items-center justify-between">
                <span className="text-body font-semibold text-foreground-700">Apotheke {i + 1}</span>
                <button type="button" onClick={() => pharmacyHelpers.remove(i)} className={CSS.btnDelete} aria-label={`Apotheke ${i + 1} entfernen`} title="Entfernen">
                  <IconTrash className="w-[1.125rem] h-[1.125rem]" />
                </button>
              </div>
              <FormField label="Name" value={pharmacy.name} onChange={(v) => pharmacyHelpers.update(i, "name", v)} placeholder="Name der Apotheke" />
              <FormField label="Telefon" type="tel" value={pharmacy.phone || ""} onChange={(v) => pharmacyHelpers.update(i, "phone", v)} placeholder="Telefonnummer" />
              <FormField label="Adresse" value={pharmacy.address || ""} onChange={(v) => pharmacyHelpers.update(i, "address", v)} placeholder="Strasse und Ort" />
            </div>
          ))}
          <button type="button" onClick={pharmacyHelpers.add} className={CSS.btnAddDashed}>
            <IconPlus className="w-4 h-4" /> Apotheke hinzufügen
          </button>
          <ModalActions onCancel={closeModal} onSave={() => saveSection("pharmacies")} isSaving={isSaving} />
        </InlineModal>
      )}

      {activeModal === "emergency_contact" && (
        <InlineModal title="Notfallkontakt bearbeiten" onClose={closeModal}>
          <FormField label="Name" value={emergencyContact.name} onChange={(v) => setEmergencyContact({ ...emergencyContact, name: v })} placeholder="Name der Kontaktperson" />
          <FormField label="Telefon" type="tel" value={emergencyContact.phone || ""} onChange={(v) => setEmergencyContact({ ...emergencyContact, phone: v })} placeholder="Telefonnummer" />
          <FormField label="Beziehung" value={emergencyContact.relationship || ""} onChange={(v) => setEmergencyContact({ ...emergencyContact, relationship: v })} placeholder="z.B. Partner, Elternteil, Freund..." />
          <ModalActions onCancel={closeModal} onSave={() => saveSection("emergency_contact")} isSaving={isSaving} />
        </InlineModal>
      )}
    </ProtectedRoute>
  );
}
