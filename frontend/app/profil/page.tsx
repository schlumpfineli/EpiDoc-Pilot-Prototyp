"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { profileApi, authApi, UserProfile } from "@/lib/api";
import { toastService } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";

type Doctor = { name: string; phone?: string; email?: string };
type Clinic = { name: string; phone?: string; address?: string };
type Pharmacy = { name: string; phone?: string; address?: string };
type EmergencyContact = { name: string; phone?: string; relationship?: string };

export default function ProfilPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);

  // Bearbeitungs-States
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Formular-States
  const [disease, setDisease] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    name: "",
    phone: "",
    relationship: "",
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getUser();
      const userData = response.user as UserProfile;
      setProfileData(userData);

      // Formular-States initialisieren
      setDisease(userData.disease || "");
      setDoctors(userData.doctors || []);
      setClinics(userData.clinics || []);
      setPharmacies(userData.pharmacies || []);
      setEmergencyContact(
        userData.emergency_contact || { name: "", phone: "", relationship: "" }
      );
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

  const saveSection = async (section: string) => {
    try {
      setIsSaving(true);
      let data: Partial<UserProfile> = {};

      switch (section) {
        case "disease":
          data = { disease: disease.trim() || undefined };
          break;
        case "doctors":
          data = {
            doctors: doctors.filter((d) => d.name.trim()),
          };
          break;
        case "clinics":
          data = {
            clinics: clinics.filter((c) => c.name.trim()),
          };
          break;
        case "pharmacies":
          data = {
            pharmacies: pharmacies.filter((p) => p.name.trim()),
          };
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
      setEditingSection(null);
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

  const cancelEdit = () => {
    // Reset auf gespeicherte Daten
    if (profileData) {
      setDisease(profileData.disease || "");
      setDoctors(profileData.doctors || []);
      setClinics(profileData.clinics || []);
      setPharmacies(profileData.pharmacies || []);
      setEmergencyContact(
        profileData.emergency_contact || { name: "", phone: "", relationship: "" }
      );
    }
    setEditingSection(null);
  };

  // Doctor-Helpers
  const addDoctor = () => setDoctors([...doctors, { name: "", phone: "", email: "" }]);
  const removeDoctor = (index: number) =>
    setDoctors(doctors.filter((_, i) => i !== index));
  const updateDoctor = (index: number, field: keyof Doctor, value: string) =>
    setDoctors(doctors.map((d, i) => (i === index ? { ...d, [field]: value } : d)));

  // Clinic-Helpers
  const addClinic = () => setClinics([...clinics, { name: "", phone: "", address: "" }]);
  const removeClinic = (index: number) =>
    setClinics(clinics.filter((_, i) => i !== index));
  const updateClinic = (index: number, field: keyof Clinic, value: string) =>
    setClinics(clinics.map((c, i) => (i === index ? { ...c, [field]: value } : c)));

  // Pharmacy-Helpers
  const addPharmacy = () =>
    setPharmacies([...pharmacies, { name: "", phone: "", address: "" }]);
  const removePharmacy = (index: number) =>
    setPharmacies(pharmacies.filter((_, i) => i !== index));
  const updatePharmacy = (index: number, field: keyof Pharmacy, value: string) =>
    setPharmacies(
      pharmacies.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );

  // Shared input classes
  const inputClass =
    "w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200";

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-body text-foreground-600">Lädt Profil...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background-50 to-white px-[var(--spacing-s)] sm:px-[var(--spacing-m)] md:px-[var(--spacing-l)] lg:px-[var(--spacing-xl)] xl:px-[var(--spacing-2xl)] 2xl:px-[var(--spacing-3xl)] py-[var(--spacing-2xs)] sm:py-[var(--spacing-s)] md:py-[var(--spacing-m)] lg:py-[var(--spacing-l)] xl:py-[var(--spacing-xl)] 2xl:py-[var(--spacing-2xl)] text-foreground-900">
        <div className="mx-auto flex w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-[90rem] xl:max-w-[100rem] 2xl:max-w-[120rem] flex-col gap-[var(--spacing-s)] sm:gap-[var(--spacing-m)] md:gap-[var(--spacing-l)] lg:gap-[var(--spacing-xl)]">
          <div className="space-y-[var(--spacing-2xs)]">
            <h1 className="text-headline-3 font-semibold leading-tight tracking-tight text-center py-[var(--spacing-m)] sm:py-[var(--spacing-l)] md:py-[var(--spacing-xl)]">
              Mein Profil
            </h1>
          </div>

          {/* Konto-Informationen (Read-only) */}
          {profileData && (
            <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
              <h2 className="text-h5 font-semibold text-foreground-900 mb-[var(--spacing-m)]">
                Konto-Informationen
              </h2>
              <div className="space-y-[var(--spacing-2xs)]">
                <div className="flex justify-between">
                  <span className="text-body-small text-foreground-600">User-ID:</span>
                  <span className="text-body-small font-medium text-foreground-900">
                    {profileData.display_name || `User-${profileData.id}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-small text-foreground-600">E-Mail:</span>
                  <span className="text-body-small font-medium text-foreground-900">
                    {profileData.email || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-body-small text-foreground-600">Rolle:</span>
                  <span className="text-body-small font-medium text-foreground-900">
                    {profileData.role === "patient" ? "Patient" : "Angehöriger"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Diagnose */}
          <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
            <div className="flex items-center justify-between mb-[var(--spacing-m)]">
              <h2 className="text-h5 font-semibold text-foreground-900">
                Diagnose / Epilepsieform
              </h2>
              {editingSection !== "disease" && (
                <button
                  type="button"
                  onClick={() => setEditingSection("disease")}
                  className="text-body-small font-medium text-primary-600 hover:text-primary-700 transition"
                >
                  Bearbeiten
                </button>
              )}
            </div>

            {editingSection === "disease" ? (
              <div className="space-y-[var(--spacing-m)]">
                <input
                  type="text"
                  value={disease}
                  onChange={(e) => setDisease(e.target.value)}
                  placeholder="z.B. Fokale Epilepsie, Juvenile myoklonische Epilepsie..."
                  className={inputClass}
                />
                <div className="flex gap-[var(--spacing-m)]">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 rounded-lg border border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => saveSection("disease")}
                    disabled={isSaving}
                    className="flex-1 rounded-lg bg-primary-600 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isSaving ? "Speichert..." : "Speichern"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-body text-foreground-700">
                {profileData?.disease || (
                  <span className="text-foreground-400 italic">
                    Noch keine Diagnose erfasst
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Behandelnde Ärzte */}
          <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
            <div className="flex items-center justify-between mb-[var(--spacing-m)]">
              <h2 className="text-h5 font-semibold text-foreground-900">
                Behandelnde Ärzte
              </h2>
              {editingSection !== "doctors" && (
                <button
                  type="button"
                  onClick={() => setEditingSection("doctors")}
                  className="text-body-small font-medium text-primary-600 hover:text-primary-700 transition"
                >
                  Bearbeiten
                </button>
              )}
            </div>

            {editingSection === "doctors" ? (
              <div className="space-y-[var(--spacing-m)]">
                {doctors.map((doc, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-background-200 p-[var(--spacing-s)] space-y-[var(--spacing-2xs)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-body-small font-medium text-foreground-700">
                        Arzt {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDoctor(idx)}
                        className="text-body-small text-warning-500 hover:text-warning-600 transition"
                      >
                        Entfernen
                      </button>
                    </div>
                    <input
                      type="text"
                      value={doc.name}
                      onChange={(e) => updateDoctor(idx, "name", e.target.value)}
                      placeholder="Name"
                      className={inputClass}
                    />
                    <input
                      type="tel"
                      value={doc.phone || ""}
                      onChange={(e) => updateDoctor(idx, "phone", e.target.value)}
                      placeholder="Telefon"
                      className={inputClass}
                    />
                    <input
                      type="email"
                      value={doc.email || ""}
                      onChange={(e) => updateDoctor(idx, "email", e.target.value)}
                      placeholder="E-Mail"
                      className={inputClass}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDoctor}
                  className="w-full rounded-lg border border-dashed border-background-300 py-[var(--spacing-xs)] text-body-small font-medium text-foreground-600 transition hover:bg-background-50 hover:border-primary-300"
                >
                  + Arzt hinzufügen
                </button>
                <div className="flex gap-[var(--spacing-m)]">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 rounded-lg border border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => saveSection("doctors")}
                    disabled={isSaving}
                    className="flex-1 rounded-lg bg-primary-600 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isSaving ? "Speichert..." : "Speichern"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {profileData?.doctors && profileData.doctors.length > 0 ? (
                  <div className="space-y-[var(--spacing-s)]">
                    {profileData.doctors.map((doc, idx) => (
                      <div key={idx} className="space-y-[var(--spacing-3xs)]">
                        <p className="text-body font-medium text-foreground-900">
                          {doc.name}
                        </p>
                        {doc.phone && (
                          <p className="text-body-small text-foreground-600">
                            Tel: {doc.phone}
                          </p>
                        )}
                        {doc.email && (
                          <p className="text-body-small text-foreground-600">
                            E-Mail: {doc.email}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-body text-foreground-400 italic">
                    Noch keine Ärzte erfasst
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Kliniken */}
          <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
            <div className="flex items-center justify-between mb-[var(--spacing-m)]">
              <h2 className="text-h5 font-semibold text-foreground-900">
                Kliniken / Spitäler
              </h2>
              {editingSection !== "clinics" && (
                <button
                  type="button"
                  onClick={() => setEditingSection("clinics")}
                  className="text-body-small font-medium text-primary-600 hover:text-primary-700 transition"
                >
                  Bearbeiten
                </button>
              )}
            </div>

            {editingSection === "clinics" ? (
              <div className="space-y-[var(--spacing-m)]">
                {clinics.map((clinic, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-background-200 p-[var(--spacing-s)] space-y-[var(--spacing-2xs)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-body-small font-medium text-foreground-700">
                        Klinik {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeClinic(idx)}
                        className="text-body-small text-warning-500 hover:text-warning-600 transition"
                      >
                        Entfernen
                      </button>
                    </div>
                    <input
                      type="text"
                      value={clinic.name}
                      onChange={(e) => updateClinic(idx, "name", e.target.value)}
                      placeholder="Name"
                      className={inputClass}
                    />
                    <input
                      type="tel"
                      value={clinic.phone || ""}
                      onChange={(e) => updateClinic(idx, "phone", e.target.value)}
                      placeholder="Telefon"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={clinic.address || ""}
                      onChange={(e) => updateClinic(idx, "address", e.target.value)}
                      placeholder="Adresse"
                      className={inputClass}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addClinic}
                  className="w-full rounded-lg border border-dashed border-background-300 py-[var(--spacing-xs)] text-body-small font-medium text-foreground-600 transition hover:bg-background-50 hover:border-primary-300"
                >
                  + Klinik hinzufügen
                </button>
                <div className="flex gap-[var(--spacing-m)]">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 rounded-lg border border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => saveSection("clinics")}
                    disabled={isSaving}
                    className="flex-1 rounded-lg bg-primary-600 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isSaving ? "Speichert..." : "Speichern"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {profileData?.clinics && profileData.clinics.length > 0 ? (
                  <div className="space-y-[var(--spacing-s)]">
                    {profileData.clinics.map((clinic, idx) => (
                      <div key={idx} className="space-y-[var(--spacing-3xs)]">
                        <p className="text-body font-medium text-foreground-900">
                          {clinic.name}
                        </p>
                        {clinic.phone && (
                          <p className="text-body-small text-foreground-600">
                            Tel: {clinic.phone}
                          </p>
                        )}
                        {clinic.address && (
                          <p className="text-body-small text-foreground-600">
                            Adresse: {clinic.address}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-body text-foreground-400 italic">
                    Noch keine Kliniken erfasst
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Apotheken */}
          <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
            <div className="flex items-center justify-between mb-[var(--spacing-m)]">
              <h2 className="text-h5 font-semibold text-foreground-900">
                Apotheken
              </h2>
              {editingSection !== "pharmacies" && (
                <button
                  type="button"
                  onClick={() => setEditingSection("pharmacies")}
                  className="text-body-small font-medium text-primary-600 hover:text-primary-700 transition"
                >
                  Bearbeiten
                </button>
              )}
            </div>

            {editingSection === "pharmacies" ? (
              <div className="space-y-[var(--spacing-m)]">
                {pharmacies.map((pharmacy, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-background-200 p-[var(--spacing-s)] space-y-[var(--spacing-2xs)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-body-small font-medium text-foreground-700">
                        Apotheke {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePharmacy(idx)}
                        className="text-body-small text-warning-500 hover:text-warning-600 transition"
                      >
                        Entfernen
                      </button>
                    </div>
                    <input
                      type="text"
                      value={pharmacy.name}
                      onChange={(e) => updatePharmacy(idx, "name", e.target.value)}
                      placeholder="Name"
                      className={inputClass}
                    />
                    <input
                      type="tel"
                      value={pharmacy.phone || ""}
                      onChange={(e) => updatePharmacy(idx, "phone", e.target.value)}
                      placeholder="Telefon"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={pharmacy.address || ""}
                      onChange={(e) => updatePharmacy(idx, "address", e.target.value)}
                      placeholder="Adresse"
                      className={inputClass}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPharmacy}
                  className="w-full rounded-lg border border-dashed border-background-300 py-[var(--spacing-xs)] text-body-small font-medium text-foreground-600 transition hover:bg-background-50 hover:border-primary-300"
                >
                  + Apotheke hinzufügen
                </button>
                <div className="flex gap-[var(--spacing-m)]">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 rounded-lg border border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => saveSection("pharmacies")}
                    disabled={isSaving}
                    className="flex-1 rounded-lg bg-primary-600 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isSaving ? "Speichert..." : "Speichern"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {profileData?.pharmacies && profileData.pharmacies.length > 0 ? (
                  <div className="space-y-[var(--spacing-s)]">
                    {profileData.pharmacies.map((pharmacy, idx) => (
                      <div key={idx} className="space-y-[var(--spacing-3xs)]">
                        <p className="text-body font-medium text-foreground-900">
                          {pharmacy.name}
                        </p>
                        {pharmacy.phone && (
                          <p className="text-body-small text-foreground-600">
                            Tel: {pharmacy.phone}
                          </p>
                        )}
                        {pharmacy.address && (
                          <p className="text-body-small text-foreground-600">
                            Adresse: {pharmacy.address}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-body text-foreground-400 italic">
                    Noch keine Apotheken erfasst
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notfallkontakt */}
          <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
            <div className="flex items-center justify-between mb-[var(--spacing-m)]">
              <h2 className="text-h5 font-semibold text-foreground-900">
                Notfallkontakt
              </h2>
              {editingSection !== "emergency_contact" && (
                <button
                  type="button"
                  onClick={() => setEditingSection("emergency_contact")}
                  className="text-body-small font-medium text-primary-600 hover:text-primary-700 transition"
                >
                  Bearbeiten
                </button>
              )}
            </div>

            {editingSection === "emergency_contact" ? (
              <div className="space-y-[var(--spacing-m)]">
                <div>
                  <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                    Name
                  </label>
                  <input
                    type="text"
                    value={emergencyContact.name}
                    onChange={(e) =>
                      setEmergencyContact({ ...emergencyContact, name: e.target.value })
                    }
                    placeholder="Name der Kontaktperson"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={emergencyContact.phone || ""}
                    onChange={(e) =>
                      setEmergencyContact({ ...emergencyContact, phone: e.target.value })
                    }
                    placeholder="Telefonnummer"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                    Beziehung
                  </label>
                  <input
                    type="text"
                    value={emergencyContact.relationship || ""}
                    onChange={(e) =>
                      setEmergencyContact({
                        ...emergencyContact,
                        relationship: e.target.value,
                      })
                    }
                    placeholder="z.B. Partner, Elternteil, Freund..."
                    className={inputClass}
                  />
                </div>
                <div className="flex gap-[var(--spacing-m)]">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 rounded-lg border border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => saveSection("emergency_contact")}
                    disabled={isSaving}
                    className="flex-1 rounded-lg bg-primary-600 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isSaving ? "Speichert..." : "Speichern"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {profileData?.emergency_contact?.name ? (
                  <div className="space-y-[var(--spacing-3xs)]">
                    <p className="text-body font-medium text-foreground-900">
                      {profileData.emergency_contact.name}
                    </p>
                    {profileData.emergency_contact.phone && (
                      <p className="text-body-small text-foreground-600">
                        Tel: {profileData.emergency_contact.phone}
                      </p>
                    )}
                    {profileData.emergency_contact.relationship && (
                      <p className="text-body-small text-foreground-600">
                        Beziehung: {profileData.emergency_contact.relationship}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-body text-foreground-400 italic">
                    Noch kein Notfallkontakt erfasst
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Hinweis */}
          <div className="rounded-xl border border-info-200 bg-info-50 p-[var(--spacing-m)]">
            <p className="text-body-small text-foreground-700">
              <span className="font-semibold">Hinweis:</span> Diese Daten werden nur lokal in Ihrem Konto
              gespeichert und sind nur für Sie sichtbar. Sie können diese Informationen z.B. bei Arztbesuchen
              oder im Notfall nutzen.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
