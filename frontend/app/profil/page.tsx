"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { profileApi, authApi, UserProfile } from "@/lib/api";
import { toastService, Modal, Input, Button } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";

// ─── Types ───────────────────────────────────────────────────────────────────

type Doctor = { name: string; phone?: string; email?: string };
type Clinic = { name: string; phone?: string; address?: string };
type Pharmacy = { name: string; phone?: string; address?: string };
type EmergencyContact = {
  name: string;
  phone?: string;
  relationship?: string;
};

type ModalType =
  | "disease"
  | "doctors"
  | "clinics"
  | "pharmacies"
  | "emergency_contact"
  | null;

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const IconUser = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
);

const IconMedical = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
    />
  </svg>
);

const IconStethoscope = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
    />
  </svg>
);

const IconBuilding = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
    />
  </svg>
);

const IconPills = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18a.94.94 0 0 0-.662.274.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525"
    />
  </svg>
);

const IconPhone = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
    />
  </svg>
);

const IconShield = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
    />
  </svg>
);

const IconPencil = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
    />
  </svg>
);

const IconPlus = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

const IconTrash = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);

const IconMail = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
    />
  </svg>
);

const IconMapPin = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
    />
  </svg>
);

// ─── Helper Components ───────────────────────────────────────────────────────

function ProfileCompletionBar({ percentage }: { percentage: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground-500">Profil-Vervollständigung</span>
        <span className="font-medium text-foreground-700 tabular-nums">
          {percentage}%
        </span>
      </div>
      <div className="h-2 bg-background-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            background:
              percentage === 100
                ? "oklch(0.78 0.07 150)"
                : "oklch(0.30 0.04 250)",
          }}
        />
      </div>
    </div>
  );
}

function PrivacyNote() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-primary-50 border border-primary-100 px-3.5 py-2.5 sm:px-4 sm:py-3">
      <IconShield className="w-4 h-4 text-primary-400 shrink-0" />
      <p className="text-sm text-foreground-600">
        Diese Daten sind nur für Sie sichtbar.
      </p>
    </div>
  );
}

function EmptyState({
  message,
  onAdd,
  addLabel,
}: {
  message: string;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="flex flex-col items-center py-5 gap-3">
      <p className="text-sm text-foreground-400 italic text-center">
        {message}
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-background-300 px-4 py-2 text-sm font-medium text-foreground-500 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 active:scale-[0.98]"
      >
        <IconPlus className="w-4 h-4" />
        {addLabel}
      </button>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  onEdit,
  children,
  editLabel = "Bearbeiten",
}: {
  icon: React.ReactNode;
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
  editLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-background-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-background-100 bg-background-25 rounded-t-2xl">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-primary-400 shrink-0">{icon}</span>
          <h2 className="text-base sm:text-lg font-semibold text-foreground-900 truncate">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary-600 transition-all hover:bg-primary-50 active:scale-[0.97]"
        >
          <IconPencil className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{editLabel}</span>
        </button>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

/** Mini-card for a single entry in a list (doctor, clinic, pharmacy) */
function EntryCard({
  name,
  details,
}: {
  name: string;
  details: { icon: React.ReactNode; text: string }[];
}) {
  return (
    <div className="rounded-xl border border-background-200 bg-background-25 px-3.5 py-2.5 space-y-1">
      <p className="text-base font-medium text-foreground-900 break-words">
        {name}
      </p>
      {details
        .filter((d) => d.text)
        .map((d, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-foreground-500"
          >
            <span className="shrink-0">{d.icon}</span>
            <span className="text-sm break-all">{d.text}</span>
          </div>
        ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProfilPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // ── Form State (for modals) ──
  const [disease, setDisease] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    name: "",
    phone: "",
    relationship: "",
  });

  // ── Data Loading ──
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getUser();
      const userData = response.user as UserProfile;
      setProfileData(userData);
      syncFormState(userData);
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : "Fehler beim Laden des Profils";
      toastService.show(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [user, loadProfile]);

  function syncFormState(data: UserProfile) {
    setDisease(data.disease || "");
    setDoctors(data.doctors || []);
    setClinics(data.clinics || []);
    setPharmacies(data.pharmacies || []);
    setEmergencyContact(
      data.emergency_contact || { name: "", phone: "", relationship: "" }
    );
  }

  // ── Saving ──
  const saveSection = async (section: ModalType) => {
    if (!section) return;
    try {
      setIsSaving(true);
      let data: Partial<UserProfile> = {};

      switch (section) {
        case "disease":
          data = { disease: disease.trim() || undefined };
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
          data = {
            emergency_contact: emergencyContact.name.trim()
              ? emergencyContact
              : undefined,
          };
          break;
      }

      await profileApi.update(data);
      toastService.show("Profil aktualisiert", "success");
      setActiveModal(null);
      await loadProfile();
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : "Fehler beim Speichern";
      toastService.show(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const openModal = (modal: ModalType) => {
    // Reset form to current data before opening
    if (profileData) syncFormState(profileData);
    setActiveModal(modal);
  };

  const closeModal = () => {
    if (profileData) syncFormState(profileData);
    setActiveModal(null);
  };

  // ── Helpers for list entries ──
  const addDoctor = () =>
    setDoctors([...doctors, { name: "", phone: "", email: "" }]);
  const removeDoctor = (i: number) =>
    setDoctors(doctors.filter((_, idx) => idx !== i));
  const updateDoctor = (i: number, field: keyof Doctor, value: string) =>
    setDoctors(doctors.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));

  const addClinic = () =>
    setClinics([...clinics, { name: "", phone: "", address: "" }]);
  const removeClinic = (i: number) =>
    setClinics(clinics.filter((_, idx) => idx !== i));
  const updateClinic = (i: number, field: keyof Clinic, value: string) =>
    setClinics(clinics.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));

  const addPharmacy = () =>
    setPharmacies([...pharmacies, { name: "", phone: "", address: "" }]);
  const removePharmacy = (i: number) =>
    setPharmacies(pharmacies.filter((_, idx) => idx !== i));
  const updatePharmacy = (i: number, field: keyof Pharmacy, value: string) =>
    setPharmacies(
      pharmacies.map((p, idx) => (idx === i ? { ...p, [field]: value } : p))
    );

  // ── Profile Completion ──
  const completionPercentage = (() => {
    if (!profileData) return 0;
    const sections = [
      !!profileData.disease,
      !!(profileData.doctors && profileData.doctors.length > 0),
      !!(profileData.clinics && profileData.clinics.length > 0),
      !!(profileData.pharmacies && profileData.pharmacies.length > 0),
      !!profileData.emergency_contact?.name,
    ];
    const filled = sections.filter(Boolean).length;
    return Math.round((filled / sections.length) * 100);
  })();

  // ── Loading State ──
  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-500" />
            <p className="text-body-small text-foreground-500">
              Profil wird geladen...
            </p>
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
          <header>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground-900 mb-3">
              Mein Profil
            </h1>
            <ProfileCompletionBar percentage={completionPercentage} />
          </header>

          <div className="space-y-4">
            {/* ── Privacy Note ── */}
            <PrivacyNote />

            {/* ── Section 1: Account Info ── */}
            {profileData && (
              <div className="rounded-2xl border border-background-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-background-100 bg-background-25 rounded-t-2xl">
                  <span className="text-primary-400 shrink-0">
                    <IconUser className="w-5 h-5" />
                  </span>
                  <h2 className="text-base sm:text-lg font-semibold text-foreground-900">
                    Konto-Informationen
                  </h2>
                </div>
                <div className="px-4 py-3 divide-y divide-background-100">
                  <div className="flex justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <span className="text-sm text-foreground-500 shrink-0">
                      User-ID
                    </span>
                    <span className="text-sm font-medium text-foreground-800 text-right break-all">
                      {profileData.display_name || `User-${profileData.id}`}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 py-2">
                    <span className="text-sm text-foreground-500 shrink-0">
                      E-Mail
                    </span>
                    <span className="text-sm font-medium text-foreground-800 text-right break-all">
                      {profileData.email || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 py-2 last:pb-0">
                    <span className="text-sm text-foreground-500 shrink-0">
                      Rolle
                    </span>
                    <span className="text-sm font-medium text-foreground-800">
                      {profileData.role === "patient"
                        ? "Patient"
                        : "Angehöriger"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Section 2: Diagnose ── */}
            <SectionCard
              icon={<IconMedical className="w-5 h-5" />}
              title="Diagnose / Epilepsieform"
              onEdit={() => openModal("disease")}
            >
              {profileData?.disease ? (
                <p className="text-body text-foreground-800">
                  {profileData.disease}
                </p>
              ) : (
                <EmptyState
                  message="Noch keine Diagnose erfasst"
                  onAdd={() => openModal("disease")}
                  addLabel="Diagnose hinzufügen"
                />
              )}
            </SectionCard>

            {/* ── Section 3: Doctors ── */}
            <SectionCard
              icon={<IconStethoscope className="w-5 h-5" />}
              title="Behandelnde Ärzte"
              onEdit={() => openModal("doctors")}
            >
              {profileData?.doctors && profileData.doctors.length > 0 ? (
                <div className="space-y-2.5">
                  {profileData.doctors.map((doc, i) => (
                    <EntryCard
                      key={i}
                      name={doc.name}
                      details={[
                        {
                          icon: <IconPhone className="w-3.5 h-3.5" />,
                          text: doc.phone || "",
                        },
                        {
                          icon: <IconMail className="w-3.5 h-3.5" />,
                          text: doc.email || "",
                        },
                      ]}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => openModal("doctors")}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition mt-2"
                  >
                    <IconPlus className="w-3.5 h-3.5" />
                    Arzt hinzufügen
                  </button>
                </div>
              ) : (
                <EmptyState
                  message="Noch keine Ärzte erfasst"
                  onAdd={() => openModal("doctors")}
                  addLabel="Arzt hinzufügen"
                />
              )}
            </SectionCard>

            {/* ── Section 4: Clinics ── */}
            <SectionCard
              icon={<IconBuilding className="w-5 h-5" />}
              title="Kliniken / Spitäler"
              onEdit={() => openModal("clinics")}
            >
              {profileData?.clinics && profileData.clinics.length > 0 ? (
                <div className="space-y-2.5">
                  {profileData.clinics.map((clinic, i) => (
                    <EntryCard
                      key={i}
                      name={clinic.name}
                      details={[
                        {
                          icon: <IconPhone className="w-3.5 h-3.5" />,
                          text: clinic.phone || "",
                        },
                        {
                          icon: <IconMapPin className="w-3.5 h-3.5" />,
                          text: clinic.address || "",
                        },
                      ]}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => openModal("clinics")}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition mt-2"
                  >
                    <IconPlus className="w-3.5 h-3.5" />
                    Klinik hinzufügen
                  </button>
                </div>
              ) : (
                <EmptyState
                  message="Noch keine Kliniken erfasst"
                  onAdd={() => openModal("clinics")}
                  addLabel="Klinik hinzufügen"
                />
              )}
            </SectionCard>

            {/* ── Section 5: Pharmacies ── */}
            <SectionCard
              icon={<IconPills className="w-5 h-5" />}
              title="Apotheken"
              onEdit={() => openModal("pharmacies")}
            >
              {profileData?.pharmacies && profileData.pharmacies.length > 0 ? (
                <div className="space-y-2.5">
                  {profileData.pharmacies.map((pharmacy, i) => (
                    <EntryCard
                      key={i}
                      name={pharmacy.name}
                      details={[
                        {
                          icon: <IconPhone className="w-3.5 h-3.5" />,
                          text: pharmacy.phone || "",
                        },
                        {
                          icon: <IconMapPin className="w-3.5 h-3.5" />,
                          text: pharmacy.address || "",
                        },
                      ]}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => openModal("pharmacies")}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition mt-2"
                  >
                    <IconPlus className="w-3.5 h-3.5" />
                    Apotheke hinzufügen
                  </button>
                </div>
              ) : (
                <EmptyState
                  message="Noch keine Apotheken erfasst"
                  onAdd={() => openModal("pharmacies")}
                  addLabel="Apotheke hinzufügen"
                />
              )}
            </SectionCard>

            {/* ── Section 6: Emergency Contact ── */}
            <SectionCard
              icon={<IconPhone className="w-5 h-5" />}
              title="Notfallkontakt"
              onEdit={() => openModal("emergency_contact")}
            >
              {profileData?.emergency_contact?.name ? (
                <div className="space-y-1">
                  <p className="text-base font-medium text-foreground-900">
                    {profileData.emergency_contact.name}
                  </p>
                  {profileData.emergency_contact.phone && (
                    <div className="flex items-center gap-2 text-foreground-500">
                      <IconPhone className="w-3.5 h-3.5" />
                      <span className="text-sm">
                        {profileData.emergency_contact.phone}
                      </span>
                    </div>
                  )}
                  {profileData.emergency_contact.relationship && (
                    <div className="flex items-center gap-2 text-foreground-500">
                      <IconUser className="w-3.5 h-3.5" />
                      <span className="text-sm">
                        {profileData.emergency_contact.relationship}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  message="Noch kein Notfallkontakt erfasst"
                  onAdd={() => openModal("emergency_contact")}
                  addLabel="Notfallkontakt hinzufügen"
                />
              )}
            </SectionCard>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── MODALS ─────────────────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {/* ── Disease Modal ── */}
      <Modal
        isOpen={activeModal === "disease"}
        onClose={closeModal}
        title="Diagnose bearbeiten"
        size="md"
      >
        <div className="p-5 space-y-4">
          <Input
            label="Diagnose / Epilepsieform"
            value={disease}
            onChange={(e) => setDisease(e.target.value)}
            placeholder="z.B. Fokale Epilepsie, Juvenile myoklonische Epilepsie..."
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={closeModal}>
              Abbrechen
            </Button>
            <Button
              fullWidth
              onClick={() => saveSection("disease")}
              disabled={isSaving}
            >
              {isSaving ? "Speichert..." : "Speichern"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Doctors Modal ── */}
      <Modal
        isOpen={activeModal === "doctors"}
        onClose={closeModal}
        title="Ärzte bearbeiten"
        size="lg"
      >
        <div className="p-5 space-y-4">
          {doctors.length === 0 && (
            <p className="text-body-small text-foreground-400 text-center py-3">
              Noch keine Ärzte hinzugefügt.
            </p>
          )}
          {doctors.map((doc, i) => (
            <div
              key={i}
              className="rounded-xl border border-background-200 bg-background-25 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-body-small font-semibold text-foreground-700">
                  Arzt {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeDoctor(i)}
                  className="inline-flex items-center gap-1 rounded-lg p-1.5 text-warning-500 hover:bg-warning-50 transition"
                  aria-label={`Arzt ${i + 1} entfernen`}
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
              <Input
                label="Name"
                value={doc.name}
                onChange={(e) => updateDoctor(i, "name", e.target.value)}
                placeholder="Name des Arztes"
              />
              <Input
                label="Telefon"
                type="tel"
                value={doc.phone || ""}
                onChange={(e) => updateDoctor(i, "phone", e.target.value)}
                placeholder="Telefonnummer"
              />
              <Input
                label="E-Mail"
                type="email"
                value={doc.email || ""}
                onChange={(e) => updateDoctor(i, "email", e.target.value)}
                placeholder="E-Mail-Adresse"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addDoctor}
            className="w-full rounded-xl border-2 border-dashed border-background-300 py-3 text-body-small font-medium text-foreground-500 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center gap-1.5"
          >
            <IconPlus className="w-4 h-4" />
            Arzt hinzufügen
          </button>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" fullWidth onClick={closeModal}>
              Abbrechen
            </Button>
            <Button
              fullWidth
              onClick={() => saveSection("doctors")}
              disabled={isSaving}
            >
              {isSaving ? "Speichert..." : "Speichern"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Clinics Modal ── */}
      <Modal
        isOpen={activeModal === "clinics"}
        onClose={closeModal}
        title="Kliniken bearbeiten"
        size="lg"
      >
        <div className="p-5 space-y-4">
          {clinics.length === 0 && (
            <p className="text-body-small text-foreground-400 text-center py-3">
              Noch keine Kliniken hinzugefügt.
            </p>
          )}
          {clinics.map((clinic, i) => (
            <div
              key={i}
              className="rounded-xl border border-background-200 bg-background-25 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-body-small font-semibold text-foreground-700">
                  Klinik {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeClinic(i)}
                  className="inline-flex items-center gap-1 rounded-lg p-1.5 text-warning-500 hover:bg-warning-50 transition"
                  aria-label={`Klinik ${i + 1} entfernen`}
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
              <Input
                label="Name"
                value={clinic.name}
                onChange={(e) => updateClinic(i, "name", e.target.value)}
                placeholder="Name der Klinik"
              />
              <Input
                label="Telefon"
                type="tel"
                value={clinic.phone || ""}
                onChange={(e) => updateClinic(i, "phone", e.target.value)}
                placeholder="Telefonnummer"
              />
              <Input
                label="Adresse"
                value={clinic.address || ""}
                onChange={(e) => updateClinic(i, "address", e.target.value)}
                placeholder="Strasse und Ort"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addClinic}
            className="w-full rounded-xl border-2 border-dashed border-background-300 py-3 text-body-small font-medium text-foreground-500 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center gap-1.5"
          >
            <IconPlus className="w-4 h-4" />
            Klinik hinzufügen
          </button>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" fullWidth onClick={closeModal}>
              Abbrechen
            </Button>
            <Button
              fullWidth
              onClick={() => saveSection("clinics")}
              disabled={isSaving}
            >
              {isSaving ? "Speichert..." : "Speichern"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Pharmacies Modal ── */}
      <Modal
        isOpen={activeModal === "pharmacies"}
        onClose={closeModal}
        title="Apotheken bearbeiten"
        size="lg"
      >
        <div className="p-5 space-y-4">
          {pharmacies.length === 0 && (
            <p className="text-body-small text-foreground-400 text-center py-3">
              Noch keine Apotheken hinzugefügt.
            </p>
          )}
          {pharmacies.map((pharmacy, i) => (
            <div
              key={i}
              className="rounded-xl border border-background-200 bg-background-25 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-body-small font-semibold text-foreground-700">
                  Apotheke {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removePharmacy(i)}
                  className="inline-flex items-center gap-1 rounded-lg p-1.5 text-warning-500 hover:bg-warning-50 transition"
                  aria-label={`Apotheke ${i + 1} entfernen`}
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
              <Input
                label="Name"
                value={pharmacy.name}
                onChange={(e) => updatePharmacy(i, "name", e.target.value)}
                placeholder="Name der Apotheke"
              />
              <Input
                label="Telefon"
                type="tel"
                value={pharmacy.phone || ""}
                onChange={(e) => updatePharmacy(i, "phone", e.target.value)}
                placeholder="Telefonnummer"
              />
              <Input
                label="Adresse"
                value={pharmacy.address || ""}
                onChange={(e) => updatePharmacy(i, "address", e.target.value)}
                placeholder="Strasse und Ort"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addPharmacy}
            className="w-full rounded-xl border-2 border-dashed border-background-300 py-3 text-body-small font-medium text-foreground-500 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center gap-1.5"
          >
            <IconPlus className="w-4 h-4" />
            Apotheke hinzufügen
          </button>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" fullWidth onClick={closeModal}>
              Abbrechen
            </Button>
            <Button
              fullWidth
              onClick={() => saveSection("pharmacies")}
              disabled={isSaving}
            >
              {isSaving ? "Speichert..." : "Speichern"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Emergency Contact Modal ── */}
      <Modal
        isOpen={activeModal === "emergency_contact"}
        onClose={closeModal}
        title="Notfallkontakt bearbeiten"
        size="md"
      >
        <div className="p-5 space-y-4">
          <Input
            label="Name"
            value={emergencyContact.name}
            onChange={(e) =>
              setEmergencyContact({ ...emergencyContact, name: e.target.value })
            }
            placeholder="Name der Kontaktperson"
          />
          <Input
            label="Telefon"
            type="tel"
            value={emergencyContact.phone || ""}
            onChange={(e) =>
              setEmergencyContact({
                ...emergencyContact,
                phone: e.target.value,
              })
            }
            placeholder="Telefonnummer"
          />
          <Input
            label="Beziehung"
            value={emergencyContact.relationship || ""}
            onChange={(e) =>
              setEmergencyContact({
                ...emergencyContact,
                relationship: e.target.value,
              })
            }
            placeholder="z.B. Partner, Elternteil, Freund..."
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={closeModal}>
              Abbrechen
            </Button>
            <Button
              fullWidth
              onClick={() => saveSection("emergency_contact")}
              disabled={isSaving}
            >
              {isSaving ? "Speichert..." : "Speichern"}
            </Button>
          </div>
        </div>
      </Modal>
    </ProtectedRoute>
  );
}
