"use client";

import { useState, useEffect, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { profileApi, authApi, UserProfile } from "@/lib/api";
import { toastService } from "@/components/ui";
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

const IconChevronDown = ({ className = "w-5 h-5" }: { className?: string }) => (
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
      d="m19.5 8.25-7.5 7.5-7.5-7.5"
    />
  </svg>
);

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-background-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 bg-background-25 transition-colors hover:bg-background-100 cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-primary-400 shrink-0">{icon}</span>
          <h2 className="text-base sm:text-lg font-semibold text-foreground-900 truncate">
            {title}
          </h2>
        </div>
        <span className={`text-foreground-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          <IconChevronDown className="w-5 h-5" />
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-background-100">
          <div className="px-4 py-4">{children}</div>
        </div>
      )}
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
      <div className="min-h-screen bg-gradient-to-br from-background-50 to-white px-3 sm:px-5 md:px-6 lg:px-10 xl:px-12 2xl:px-16 py-2 sm:py-3 md:py-5 lg:py-6 xl:py-10 2xl:py-12 text-foreground-900">
        <div className="mx-auto flex w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-7xl flex-col gap-3 sm:gap-5 md:gap-6 lg:gap-10">
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

            {/* ── Section 1: Diagnose ── */}
            <SectionCard
              icon={<IconMedical className="w-5 h-5" />}
              title="Diagnose / Epilepsieform"
            >
              {profileData?.disease ? (
                <div className="space-y-[var(--spacing-s)]">
                  <p className="text-body text-foreground-800">
                    {profileData.disease}
                  </p>
                  <div className="flex items-center gap-[var(--spacing-2xs)]">
                    <button type="button" onClick={() => openModal("disease")} className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium text-primary-600 hover:text-primary-700 border border-primary-300 hover:border-primary-400 rounded-lg transition">
                      Bearbeiten
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  message="Noch keine Diagnose erfasst"
                  onAdd={() => openModal("disease")}
                  addLabel="Diagnose hinzufügen"
                />
              )}
            </SectionCard>

            {/* ── Section 2: Doctors ── */}
            <SectionCard
              icon={<IconStethoscope className="w-5 h-5" />}
              title="Behandelnde Ärzte"
            >
              {profileData?.doctors && profileData.doctors.length > 0 ? (
                <div className="space-y-[var(--spacing-s)]">
                  {profileData.doctors.map((doc, i) => (
                    <EntryCard key={i} name={doc.name} details={[
                      { icon: <IconPhone className="w-3.5 h-3.5" />, text: doc.phone || "" },
                      { icon: <IconMail className="w-3.5 h-3.5" />, text: doc.email || "" },
                    ]} />
                  ))}
                  <div className="flex items-center gap-[var(--spacing-2xs)]">
                    <button type="button" onClick={() => openModal("doctors")} className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium text-primary-600 hover:text-primary-700 border border-primary-300 hover:border-primary-400 rounded-lg transition">
                      Bearbeiten
                    </button>
                    <button type="button" onClick={() => { openModal("doctors"); addDoctor(); }} className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition">
                      + Hinzufügen
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  message="Noch keine Ärzte erfasst"
                  onAdd={() => openModal("doctors")}
                  addLabel="Arzt hinzufügen"
                />
              )}
            </SectionCard>

            {/* ── Section 3: Clinics ── */}
            <SectionCard
              icon={<IconBuilding className="w-5 h-5" />}
              title="Kliniken / Spitäler"
            >
              {profileData?.clinics && profileData.clinics.length > 0 ? (
                <div className="space-y-[var(--spacing-s)]">
                  {profileData.clinics.map((clinic, i) => (
                    <EntryCard key={i} name={clinic.name} details={[
                      { icon: <IconPhone className="w-3.5 h-3.5" />, text: clinic.phone || "" },
                      { icon: <IconMapPin className="w-3.5 h-3.5" />, text: clinic.address || "" },
                    ]} />
                  ))}
                  <div className="flex items-center gap-[var(--spacing-2xs)]">
                    <button type="button" onClick={() => openModal("clinics")} className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium text-primary-600 hover:text-primary-700 border border-primary-300 hover:border-primary-400 rounded-lg transition">
                      Bearbeiten
                    </button>
                    <button type="button" onClick={() => { openModal("clinics"); addClinic(); }} className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition">
                      + Hinzufügen
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  message="Noch keine Kliniken erfasst"
                  onAdd={() => openModal("clinics")}
                  addLabel="Klinik hinzufügen"
                />
              )}
            </SectionCard>

            {/* ── Section 4: Pharmacies ── */}
            <SectionCard
              icon={<IconPills className="w-5 h-5" />}
              title="Apotheken"
            >
              {profileData?.pharmacies && profileData.pharmacies.length > 0 ? (
                <div className="space-y-[var(--spacing-s)]">
                  {profileData.pharmacies.map((pharmacy, i) => (
                    <EntryCard key={i} name={pharmacy.name} details={[
                      { icon: <IconPhone className="w-3.5 h-3.5" />, text: pharmacy.phone || "" },
                      { icon: <IconMapPin className="w-3.5 h-3.5" />, text: pharmacy.address || "" },
                    ]} />
                  ))}
                  <div className="flex items-center gap-[var(--spacing-2xs)]">
                    <button type="button" onClick={() => openModal("pharmacies")} className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium text-primary-600 hover:text-primary-700 border border-primary-300 hover:border-primary-400 rounded-lg transition">
                      Bearbeiten
                    </button>
                    <button type="button" onClick={() => { openModal("pharmacies"); addPharmacy(); }} className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition">
                      + Hinzufügen
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  message="Noch keine Apotheken erfasst"
                  onAdd={() => openModal("pharmacies")}
                  addLabel="Apotheke hinzufügen"
                />
              )}
            </SectionCard>

            {/* ── Section 5: Emergency Contact ── */}
            <SectionCard
              icon={<IconPhone className="w-5 h-5" />}
              title="Notfallkontakt"
            >
              {profileData?.emergency_contact?.name ? (
                <div className="space-y-[var(--spacing-s)]">
                  <div className="space-y-1">
                    <p className="text-base font-medium text-foreground-900">
                      {profileData.emergency_contact.name}
                    </p>
                    {profileData.emergency_contact.phone && (
                      <div className="flex items-center gap-2 text-foreground-500">
                        <IconPhone className="w-3.5 h-3.5" />
                        <span className="text-sm">{profileData.emergency_contact.phone}</span>
                      </div>
                    )}
                    {profileData.emergency_contact.relationship && (
                      <div className="flex items-center gap-2 text-foreground-500">
                        <IconUser className="w-3.5 h-3.5" />
                        <span className="text-sm">{profileData.emergency_contact.relationship}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-[var(--spacing-2xs)]">
                    <button type="button" onClick={() => openModal("emergency_contact")} className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] text-body font-medium text-primary-600 hover:text-primary-700 border border-primary-300 hover:border-primary-400 rounded-lg transition">
                      Bearbeiten
                    </button>
                  </div>
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
      {/* ── MODALS (Diary-Stil) ──────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {/* ── Disease Modal ── */}
      {activeModal === "disease" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-[var(--spacing-s)]">
          <div className="w-full max-h-[90vh] rounded-xl bg-white shadow-xl border border-primary-500 ring-2 ring-primary-200 overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              <div className="sticky top-0 flex items-center justify-between gap-[var(--spacing-s)] border-b border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-m)]">
                <h2 className="text-body font-semibold text-foreground-900">Diagnose bearbeiten</h2>
                <button type="button" onClick={closeModal} className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100" aria-label="Schließen">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-[var(--spacing-s)] space-y-[var(--spacing-s)]">
                <div className="space-y-[var(--spacing-xs)]">
                  <label className="text-body font-medium text-foreground-800">Diagnose / Epilepsieform</label>
                  <input
                    type="text"
                    value={disease}
                    onChange={(e) => setDisease(e.target.value)}
                    placeholder="z.B. Fokale Epilepsie, Juvenile myoklonische Epilepsie..."
                    className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition"
                  />
                </div>
                <div className="flex gap-[var(--spacing-m)] pt-3">
                  <button type="button" onClick={closeModal} className="flex-1 rounded-lg border-2 border-background-200 bg-white px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50">
                    Abbrechen
                  </button>
                  <button type="button" onClick={() => saveSection("disease")} disabled={isSaving} className="flex-1 rounded-lg bg-primary-600 px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isSaving ? "Speichert..." : "Speichern"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Doctors Modal ── */}
      {activeModal === "doctors" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-[var(--spacing-s)]">
          <div className="w-full max-h-[90vh] rounded-xl bg-white shadow-xl border border-primary-500 ring-2 ring-primary-200 overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              <div className="sticky top-0 flex items-center justify-between gap-[var(--spacing-s)] border-b border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-m)]">
                <h2 className="text-body font-semibold text-foreground-900">Ärzte bearbeiten</h2>
                <button type="button" onClick={closeModal} className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100" aria-label="Schließen">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-[var(--spacing-s)] space-y-[var(--spacing-s)]">
                {doctors.length === 0 && (
                  <p className="text-body text-foreground-400 text-center py-3">
                    Noch keine Ärzte hinzugefügt.
                  </p>
                )}
                {doctors.map((doc, i) => (
                  <div key={i} className="rounded-lg border border-background-200 bg-background-25 p-[var(--spacing-s)] space-y-[var(--spacing-s)]">
                    <div className="flex items-center justify-between">
                      <span className="text-body font-semibold text-foreground-700">Arzt {i + 1}</span>
                      <button type="button" onClick={() => removeDoctor(i)} className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-500 transition hover:bg-background-100 hover:text-warning-500" aria-label={`Arzt ${i + 1} entfernen`} title="Entfernen">
                        <IconTrash className="w-[1.125rem] h-[1.125rem]" />
                      </button>
                    </div>
                    <div className="space-y-[var(--spacing-xs)]">
                      <label className="text-body font-medium text-foreground-800">Name</label>
                      <input type="text" value={doc.name} onChange={(e) => updateDoctor(i, "name", e.target.value)} placeholder="Name des Arztes" className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition" />
                    </div>
                    <div className="space-y-[var(--spacing-xs)]">
                      <label className="text-body font-medium text-foreground-800">Telefon</label>
                      <input type="tel" value={doc.phone || ""} onChange={(e) => updateDoctor(i, "phone", e.target.value)} placeholder="Telefonnummer" className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition" />
                    </div>
                    <div className="space-y-[var(--spacing-xs)]">
                      <label className="text-body font-medium text-foreground-800">E-Mail</label>
                      <input type="email" value={doc.email || ""} onChange={(e) => updateDoctor(i, "email", e.target.value)} placeholder="E-Mail-Adresse" className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition" />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addDoctor} className="w-full rounded-lg border-2 border-dashed border-background-300 py-[var(--spacing-s)] text-body font-medium text-foreground-500 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center gap-1.5">
                  <IconPlus className="w-4 h-4" />
                  Arzt hinzufügen
                </button>
                <div className="flex gap-[var(--spacing-m)] pt-3">
                  <button type="button" onClick={closeModal} className="flex-1 rounded-lg border-2 border-background-200 bg-white px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50">
                    Abbrechen
                  </button>
                  <button type="button" onClick={() => saveSection("doctors")} disabled={isSaving} className="flex-1 rounded-lg bg-primary-600 px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isSaving ? "Speichert..." : "Speichern"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Clinics Modal ── */}
      {activeModal === "clinics" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-[var(--spacing-s)]">
          <div className="w-full max-h-[90vh] rounded-xl bg-white shadow-xl border border-primary-500 ring-2 ring-primary-200 overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              <div className="sticky top-0 flex items-center justify-between gap-[var(--spacing-s)] border-b border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-m)]">
                <h2 className="text-body font-semibold text-foreground-900">Kliniken bearbeiten</h2>
                <button type="button" onClick={closeModal} className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100" aria-label="Schließen">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-[var(--spacing-s)] space-y-[var(--spacing-s)]">
                {clinics.length === 0 && (
                  <p className="text-body text-foreground-400 text-center py-3">
                    Noch keine Kliniken hinzugefügt.
                  </p>
                )}
                {clinics.map((clinic, i) => (
                  <div key={i} className="rounded-lg border border-background-200 bg-background-25 p-[var(--spacing-s)] space-y-[var(--spacing-s)]">
                    <div className="flex items-center justify-between">
                      <span className="text-body font-semibold text-foreground-700">Klinik {i + 1}</span>
                      <button type="button" onClick={() => removeClinic(i)} className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-500 transition hover:bg-background-100 hover:text-warning-500" aria-label={`Klinik ${i + 1} entfernen`} title="Entfernen">
                        <IconTrash className="w-[1.125rem] h-[1.125rem]" />
                      </button>
                    </div>
                    <div className="space-y-[var(--spacing-xs)]">
                      <label className="text-body font-medium text-foreground-800">Name</label>
                      <input type="text" value={clinic.name} onChange={(e) => updateClinic(i, "name", e.target.value)} placeholder="Name der Klinik" className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition" />
                    </div>
                    <div className="space-y-[var(--spacing-xs)]">
                      <label className="text-body font-medium text-foreground-800">Telefon</label>
                      <input type="tel" value={clinic.phone || ""} onChange={(e) => updateClinic(i, "phone", e.target.value)} placeholder="Telefonnummer" className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition" />
                    </div>
                    <div className="space-y-[var(--spacing-xs)]">
                      <label className="text-body font-medium text-foreground-800">Adresse</label>
                      <input type="text" value={clinic.address || ""} onChange={(e) => updateClinic(i, "address", e.target.value)} placeholder="Strasse und Ort" className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition" />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addClinic} className="w-full rounded-lg border-2 border-dashed border-background-300 py-[var(--spacing-s)] text-body font-medium text-foreground-500 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center gap-1.5">
                  <IconPlus className="w-4 h-4" />
                  Klinik hinzufügen
                </button>
                <div className="flex gap-[var(--spacing-m)] pt-3">
                  <button type="button" onClick={closeModal} className="flex-1 rounded-lg border-2 border-background-200 bg-white px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50">
                    Abbrechen
                  </button>
                  <button type="button" onClick={() => saveSection("clinics")} disabled={isSaving} className="flex-1 rounded-lg bg-primary-600 px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isSaving ? "Speichert..." : "Speichern"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pharmacies Modal ── */}
      {activeModal === "pharmacies" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-[var(--spacing-s)]">
          <div className="w-full max-h-[90vh] rounded-xl bg-white shadow-xl border border-primary-500 ring-2 ring-primary-200 overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              <div className="sticky top-0 flex items-center justify-between gap-[var(--spacing-s)] border-b border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-m)]">
                <h2 className="text-body font-semibold text-foreground-900">Apotheken bearbeiten</h2>
                <button type="button" onClick={closeModal} className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100" aria-label="Schließen">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-[var(--spacing-s)] space-y-[var(--spacing-s)]">
                {pharmacies.length === 0 && (
                  <p className="text-body text-foreground-400 text-center py-3">
                    Noch keine Apotheken hinzugefügt.
                  </p>
                )}
                {pharmacies.map((pharmacy, i) => (
                  <div key={i} className="rounded-lg border border-background-200 bg-background-25 p-[var(--spacing-s)] space-y-[var(--spacing-s)]">
                    <div className="flex items-center justify-between">
                      <span className="text-body font-semibold text-foreground-700">Apotheke {i + 1}</span>
                      <button type="button" onClick={() => removePharmacy(i)} className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-500 transition hover:bg-background-100 hover:text-warning-500" aria-label={`Apotheke ${i + 1} entfernen`} title="Entfernen">
                        <IconTrash className="w-[1.125rem] h-[1.125rem]" />
                      </button>
                    </div>
                    <div className="space-y-[var(--spacing-xs)]">
                      <label className="text-body font-medium text-foreground-800">Name</label>
                      <input type="text" value={pharmacy.name} onChange={(e) => updatePharmacy(i, "name", e.target.value)} placeholder="Name der Apotheke" className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition" />
                    </div>
                    <div className="space-y-[var(--spacing-xs)]">
                      <label className="text-body font-medium text-foreground-800">Telefon</label>
                      <input type="tel" value={pharmacy.phone || ""} onChange={(e) => updatePharmacy(i, "phone", e.target.value)} placeholder="Telefonnummer" className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition" />
                    </div>
                    <div className="space-y-[var(--spacing-xs)]">
                      <label className="text-body font-medium text-foreground-800">Adresse</label>
                      <input type="text" value={pharmacy.address || ""} onChange={(e) => updatePharmacy(i, "address", e.target.value)} placeholder="Strasse und Ort" className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition" />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addPharmacy} className="w-full rounded-lg border-2 border-dashed border-background-300 py-[var(--spacing-s)] text-body font-medium text-foreground-500 transition-all hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center gap-1.5">
                  <IconPlus className="w-4 h-4" />
                  Apotheke hinzufügen
                </button>
                <div className="flex gap-[var(--spacing-m)] pt-3">
                  <button type="button" onClick={closeModal} className="flex-1 rounded-lg border-2 border-background-200 bg-white px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50">
                    Abbrechen
                  </button>
                  <button type="button" onClick={() => saveSection("pharmacies")} disabled={isSaving} className="flex-1 rounded-lg bg-primary-600 px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isSaving ? "Speichert..." : "Speichern"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Emergency Contact Modal ── */}
      {activeModal === "emergency_contact" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-[var(--spacing-s)]">
          <div className="w-full max-h-[90vh] rounded-xl bg-white shadow-xl border border-primary-500 ring-2 ring-primary-200 overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              <div className="sticky top-0 flex items-center justify-between gap-[var(--spacing-s)] border-b border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-m)]">
                <h2 className="text-body font-semibold text-foreground-900">Notfallkontakt bearbeiten</h2>
                <button type="button" onClick={closeModal} className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100" aria-label="Schließen">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-[var(--spacing-s)] space-y-[var(--spacing-s)]">
                <div className="space-y-[var(--spacing-xs)]">
                  <label className="text-body font-medium text-foreground-800">Name</label>
                  <input type="text" value={emergencyContact.name} onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })} placeholder="Name der Kontaktperson" className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition" />
                </div>
                <div className="space-y-[var(--spacing-xs)]">
                  <label className="text-body font-medium text-foreground-800">Telefon</label>
                  <input type="tel" value={emergencyContact.phone || ""} onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })} placeholder="Telefonnummer" className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition" />
                </div>
                <div className="space-y-[var(--spacing-xs)]">
                  <label className="text-body font-medium text-foreground-800">Beziehung</label>
                  <input type="text" value={emergencyContact.relationship || ""} onChange={(e) => setEmergencyContact({ ...emergencyContact, relationship: e.target.value })} placeholder="z.B. Partner, Elternteil, Freund..." className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition" />
                </div>
                <div className="flex gap-[var(--spacing-m)] pt-3">
                  <button type="button" onClick={closeModal} className="flex-1 rounded-lg border-2 border-background-200 bg-white px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50">
                    Abbrechen
                  </button>
                  <button type="button" onClick={() => saveSection("emergency_contact")} disabled={isSaving} className="flex-1 rounded-lg bg-primary-600 px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isSaving ? "Speichert..." : "Speichern"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
