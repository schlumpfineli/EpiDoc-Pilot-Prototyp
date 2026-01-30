"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { profileApi, authApi, UserProfile } from "@/lib/api";
import { toastService } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

type Contact = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
};

export default function ProfilPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({
    display_name: "",
    email: "",
    disease: "",
    doctors: [] as Contact[],
    clinics: [] as Contact[],
    pharmacies: [] as Contact[],
    emergency_contact: {
      name: "",
      phone: "",
      relationship: "",
    } as Contact & { relationship?: string },
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getUser();
      setProfileData(response.user as UserProfile);
      setFormData({
        display_name: (response.user as UserProfile).display_name ?? `User-${response.user.id}`,
        email: response.user.email,
        disease: (response.user as any).disease || "",
        doctors: (response.user as any).doctors || [],
        clinics: (response.user as any).clinics || [],
        pharmacies: (response.user as any).pharmacies || [],
        emergency_contact: (response.user as any).emergency_contact || {
          name: "",
          phone: "",
          relationship: "",
        },
      });
    } catch (error: any) {
      console.error("Fehler beim Laden des Profils:", error);
      toastService.show(
        error.message || "Fehler beim Laden des Profils",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await profileApi.update(formData);
      toastService.show("Profil aktualisiert", "success");
      await loadProfile();
    } catch (error: any) {
      console.error("Fehler beim Speichern:", error);
      toastService.show(
        error.message || "Fehler beim Speichern",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsSaving(true);
      await profileApi.delete();
      toastService.show("Konto erfolgreich gelöscht", "success");
      logout();
      router.push("/login");
    } catch (error: any) {
      console.error("Fehler beim Löschen:", error);
      toastService.show(
        error.message || "Fehler beim Löschen des Kontos",
        "error"
      );
    } finally {
      setIsSaving(false);
      setShowDeleteModal(false);
    }
  };

  const addContact = (
    type: "doctors" | "clinics" | "pharmacies",
    contact: Contact
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], contact],
    }));
  };

  const removeContact = (
    type: "doctors" | "clinics" | "pharmacies",
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const updateContact = (
    type: "doctors" | "clinics" | "pharmacies",
    index: number,
    field: keyof Contact,
    value: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev[type]];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [type]: updated };
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-body text-foreground-600">Lädt Daten...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background-50 to-white px-[var(--spacing-s)] sm:px-[var(--spacing-m)] md:px-[var(--spacing-l)] lg:px-[var(--spacing-xl)] xl:px-[var(--spacing-2xl)] 2xl:px-[var(--spacing-3xl)] py-[var(--spacing-2xs)] sm:py-[var(--spacing-s)] md:py-[var(--spacing-m)] lg:py-[var(--spacing-l)] xl:py-[var(--spacing-xl)] 2xl:py-[var(--spacing-2xl)] text-foreground-900">
        <div className="mx-auto flex w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-[90rem] xl:max-w-[100rem] 2xl:max-w-[120rem] flex-col gap-[var(--spacing-s)] sm:gap-[var(--spacing-m)] md:gap-[var(--spacing-l)] lg:gap-[var(--spacing-xl)]">
          <div className="space-y-[var(--spacing-2xs)]">
            <p className="text-body-small font-medium text-primary-600">EpiDoc</p>
            <h1 className="text-headline-3 font-semibold leading-tight tracking-tight">
              Profil
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-[var(--spacing-l)]">
            {/* Persönliche Daten */}
            <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
              <h2 className="text-h5 font-semibold text-foreground-900 mb-[var(--spacing-m)]">
                Persönliche Daten
              </h2>
              <div className="space-y-[var(--spacing-m)]">
                <div>
                  <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                    Anzeigename (User-ID)
                  </label>
                  <p className="rounded-lg border border-background-200 bg-background-50 px-[var(--spacing-m)] py-[var(--spacing-s)] text-body text-foreground-700">
                    {formData.display_name}
                  </p>
                  <p className="mt-1 text-body-small text-foreground-500">
                    Im Pilotprojekt werden Sie nur über Ihre User-ID geführt. E-Mail dient für Passwort-Änderungen und Benachrichtigungen.
                  </p>
                </div>
                <div>
                  <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                    E-Mail
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              </div>
            </div>

            {/* Krankheitsdaten */}
            <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
              <h2 className="text-h5 font-semibold text-foreground-900 mb-[var(--spacing-m)]">
                Krankheitsdaten
              </h2>
              <div>
                <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                  Krankheit
                </label>
                <input
                  type="text"
                  value={formData.disease}
                  onChange={(e) =>
                    setFormData({ ...formData, disease: e.target.value })
                  }
                  className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="z.B. Epilepsie"
                />
              </div>
            </div>

            {/* Ärzte */}
            <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
              <div className="flex items-center justify-between mb-[var(--spacing-m)]">
                <h2 className="text-h5 font-semibold text-foreground-900">
                  Ärzte
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    addContact("doctors", { name: "", phone: "", email: "" })
                  }
                  className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] rounded-lg bg-primary-600 text-body-small font-medium text-white hover:bg-primary-700 transition"
                >
                  + Arzt hinzufügen
                </button>
              </div>
              <div className="space-y-[var(--spacing-m)]">
                {formData.doctors.map((doctor, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-background-200 p-[var(--spacing-s)] space-y-[var(--spacing-s)]"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-body-small font-medium text-foreground-700">
                        Arzt {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeContact("doctors", index)}
                        className="text-body-small text-red-600 hover:text-red-700"
                      >
                        Entfernen
                      </button>
                    </div>
                    <input
                      type="text"
                      value={doctor.name}
                      onChange={(e) =>
                        updateContact("doctors", index, "name", e.target.value)
                      }
                      placeholder="Name"
                      className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body-small shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    <input
                      type="tel"
                      value={doctor.phone || ""}
                      onChange={(e) =>
                        updateContact("doctors", index, "phone", e.target.value)
                      }
                      placeholder="Telefon"
                      className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body-small shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    <input
                      type="email"
                      value={doctor.email || ""}
                      onChange={(e) =>
                        updateContact("doctors", index, "email", e.target.value)
                      }
                      placeholder="E-Mail"
                      className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body-small shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                ))}
                {formData.doctors.length === 0 && (
                  <p className="text-body-small text-foreground-600 text-center py-[var(--spacing-m)]">
                    Noch keine Ärzte hinzugefügt.
                  </p>
                )}
              </div>
            </div>

            {/* Kliniken */}
            <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
              <div className="flex items-center justify-between mb-[var(--spacing-m)]">
                <h2 className="text-h5 font-semibold text-foreground-900">
                  Kliniken
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    addContact("clinics", { name: "", phone: "", address: "" })
                  }
                  className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] rounded-lg bg-primary-600 text-body-small font-medium text-white hover:bg-primary-700 transition"
                >
                  + Klinik hinzufügen
                </button>
              </div>
              <div className="space-y-[var(--spacing-m)]">
                {formData.clinics.map((clinic, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-background-200 p-[var(--spacing-s)] space-y-[var(--spacing-s)]"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-body-small font-medium text-foreground-700">
                        Klinik {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeContact("clinics", index)}
                        className="text-body-small text-red-600 hover:text-red-700"
                      >
                        Entfernen
                      </button>
                    </div>
                    <input
                      type="text"
                      value={clinic.name}
                      onChange={(e) =>
                        updateContact("clinics", index, "name", e.target.value)
                      }
                      placeholder="Name"
                      className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body-small shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    <input
                      type="tel"
                      value={clinic.phone || ""}
                      onChange={(e) =>
                        updateContact("clinics", index, "phone", e.target.value)
                      }
                      placeholder="Telefon"
                      className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body-small shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    <input
                      type="text"
                      value={clinic.address || ""}
                      onChange={(e) =>
                        updateContact("clinics", index, "address", e.target.value)
                      }
                      placeholder="Adresse"
                      className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body-small shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                ))}
                {formData.clinics.length === 0 && (
                  <p className="text-body-small text-foreground-600 text-center py-[var(--spacing-m)]">
                    Noch keine Kliniken hinzugefügt.
                  </p>
                )}
              </div>
            </div>

            {/* Apotheken */}
            <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
              <div className="flex items-center justify-between mb-[var(--spacing-m)]">
                <h2 className="text-h5 font-semibold text-foreground-900">
                  Apotheken
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    addContact("pharmacies", {
                      name: "",
                      phone: "",
                      address: "",
                    })
                  }
                  className="px-[var(--spacing-s)] py-[var(--spacing-2xs)] rounded-lg bg-primary-600 text-body-small font-medium text-white hover:bg-primary-700 transition"
                >
                  + Apotheke hinzufügen
                </button>
              </div>
              <div className="space-y-[var(--spacing-m)]">
                {formData.pharmacies.map((pharmacy, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-background-200 p-[var(--spacing-s)] space-y-[var(--spacing-s)]"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-body-small font-medium text-foreground-700">
                        Apotheke {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeContact("pharmacies", index)}
                        className="text-body-small text-red-600 hover:text-red-700"
                      >
                        Entfernen
                      </button>
                    </div>
                    <input
                      type="text"
                      value={pharmacy.name}
                      onChange={(e) =>
                        updateContact("pharmacies", index, "name", e.target.value)
                      }
                      placeholder="Name"
                      className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body-small shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    <input
                      type="tel"
                      value={pharmacy.phone || ""}
                      onChange={(e) =>
                        updateContact("pharmacies", index, "phone", e.target.value)
                      }
                      placeholder="Telefon"
                      className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body-small shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    <input
                      type="text"
                      value={pharmacy.address || ""}
                      onChange={(e) =>
                        updateContact("pharmacies", index, "address", e.target.value)
                      }
                      placeholder="Adresse"
                      className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body-small shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                ))}
                {formData.pharmacies.length === 0 && (
                  <p className="text-body-small text-foreground-600 text-center py-[var(--spacing-m)]">
                    Noch keine Apotheken hinzugefügt.
                  </p>
                )}
              </div>
            </div>

            {/* Notfallkontakt */}
            <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
              <h2 className="text-h5 font-semibold text-foreground-900 mb-[var(--spacing-m)]">
                Notfallkontakt
              </h2>
              <div className="space-y-[var(--spacing-m)]">
                <div>
                  <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergency_contact: {
                          ...formData.emergency_contact,
                          name: e.target.value,
                        },
                      })
                    }
                    required
                    className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div>
                  <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.emergency_contact.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergency_contact: {
                          ...formData.emergency_contact,
                          phone: e.target.value,
                        },
                      })
                    }
                    required
                    className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div>
                  <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                    Beziehung
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact.relationship || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergency_contact: {
                          ...formData.emergency_contact,
                          relationship: e.target.value,
                        },
                      })
                    }
                    placeholder="z.B. Partner, Elternteil, Freund"
                    className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-[var(--spacing-m)]">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 rounded-lg bg-primary-600 px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
              >
                {isSaving ? "Speichert..." : "Profil speichern"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-[var(--spacing-m)] py-[var(--spacing-s)] rounded-lg border border-red-200 bg-white text-body font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
              >
                Konto löschen
              </button>
            </div>
          </form>

          {/* Lösch-Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-[var(--spacing-s)]">
              <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-[var(--spacing-m)]">
                <div className="flex items-center justify-between mb-[var(--spacing-m)]">
                  <h2 className="text-body font-semibold text-foreground-900">
                    Konto löschen
                  </h2>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100"
                    aria-label="Schließen"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-[var(--spacing-m)]">
                  <p className="text-body text-foreground-700">
                    Möchten Sie Ihr Konto wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                  <p className="text-body-small text-foreground-600">
                    Alle Ihre Daten werden unwiderruflich gelöscht.
                  </p>

                  <div className="flex gap-[var(--spacing-m)] pt-[var(--spacing-s)]">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 rounded-lg border border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={isSaving}
                      className="flex-1 rounded-lg bg-red-600 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                    >
                      {isSaving ? "Löscht..." : "Konto löschen"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

