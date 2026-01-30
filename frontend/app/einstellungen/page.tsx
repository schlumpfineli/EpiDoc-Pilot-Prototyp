"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { profileApi, authApi, UserProfile, feedbackApi, FeedbackData } from "@/lib/api";
import { toastService } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function EinstellungenPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackData>({
    type: 'other',
    message: '',
  });
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await authApi.getUser();
      setProfileData(response.user as UserProfile);
    } catch (error: any) {
      console.error("Fehler beim Laden der Einstellungen:", error);
      toastService.show(
        error.message || "Fehler beim Laden der Einstellungen",
        "error"
      );
    } finally {
      setIsLoading(false);
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

  // Passwort ändern
  const openPasswordModal = () => {
    setPasswordForm({
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    });
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    });
  };

  const savePassword = async () => {
    if (!passwordForm.current_password.trim() || !passwordForm.new_password.trim()) {
      toastService.show("Alle Felder sind erforderlich", "error");
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toastService.show("Das neue Passwort muss mindestens 8 Zeichen lang sein", "error");
      return;
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      toastService.show("Die Passwörter stimmen nicht überein", "error");
      return;
    }
    try {
      setIsSaving(true);
      await profileApi.changePassword(passwordForm);
      toastService.show("Passwort erfolgreich geändert", "success");
      closePasswordModal();
    } catch (error: any) {
      console.error("Fehler beim Ändern des Passworts:", error);
      toastService.show(
        error.message || "Fehler beim Ändern des Passworts",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Feedback senden
  const openFeedbackModal = () => {
    setFeedbackForm({
      type: 'other',
      message: '',
    });
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackForm({
      type: 'other',
      message: '',
    });
  };

  const handleSendFeedback = async () => {
    const trimmedMessage = feedbackForm.message.trim();
    if (!trimmedMessage || trimmedMessage.length < 10) {
      toastService.show("Bitte geben Sie mindestens 10 Zeichen ein", "error");
      return;
    }
    try {
      setIsSaving(true);
      // Sende getrimmte Nachricht
      await feedbackApi.sendFeedback({
        ...feedbackForm,
        message: trimmedMessage,
      });
      toastService.show("Feedback erfolgreich gesendet. Vielen Dank!", "success");
      closeFeedbackModal();
    } catch (error: any) {
      console.error("Fehler beim Senden des Feedbacks:", error);
      toastService.show(
        error.message || "Fehler beim Senden des Feedbacks",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Datenexport
  const handleExportData = async () => {
    try {
      setIsSaving(true);
      const data = await profileApi.exportData();
      
      // Erstelle JSON-Datei
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `epidoc-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toastService.show("Daten erfolgreich exportiert", "success");
    } catch (error: any) {
      console.error("Fehler beim Exportieren:", error);
      toastService.show(
        error.message || "Fehler beim Exportieren der Daten",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
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
            <h1 className="text-headline-3 font-semibold leading-tight tracking-tight text-center py-[var(--spacing-m)] sm:py-[var(--spacing-l)] md:py-[var(--spacing-xl)]">
              Einstellungen und Support
            </h1>
          </div>

          {/* Konto-Informationen */}
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
                  <span className="text-body-small text-foreground-600">Konto erstellt:</span>
                  <span className="text-body-small font-medium text-foreground-900">
                    {profileData.created_at ? new Date(profileData.created_at).toLocaleDateString('de-CH') : "—"}
                  </span>
                </div>
                {profileData.last_login_at && (
                  <div className="flex justify-between">
                    <span className="text-body-small text-foreground-600">Letzte Anmeldung:</span>
                    <span className="text-body-small font-medium text-foreground-900">
                      {new Date(profileData.last_login_at).toLocaleDateString('de-CH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-body-small text-foreground-600">Rolle:</span>
                  <span className="text-body-small font-medium text-foreground-900">
                    {profileData.role === 'patient' ? 'Patient' : 'Angehöriger'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Konto-Verwaltung */}
          <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
            <h2 className="text-h5 font-semibold text-foreground-900 mb-[var(--spacing-m)]">
              Konto-Verwaltung
            </h2>
            <div className="space-y-[var(--spacing-s)]">
              <button
                type="button"
                onClick={openPasswordModal}
                className="w-full rounded-lg border border-background-200 bg-white px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-medium text-foreground-700 shadow-sm transition hover:bg-background-50 text-left"
              >
                Passwort ändern
              </button>
              <button
                type="button"
                onClick={handleExportData}
                disabled={isSaving}
                className="w-full rounded-lg border border-background-200 bg-white px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-medium text-foreground-700 shadow-sm transition hover:bg-background-50 text-left disabled:opacity-50"
              >
                Daten exportieren
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full rounded-lg border border-background-200 bg-white px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-medium text-foreground-600 shadow-sm transition hover:bg-background-50 text-left"
              >
                Konto löschen
              </button>
            </div>
          </div>

          {/* Feedback & Support */}
          <div className="rounded-xl border border-background-200 bg-white p-[var(--spacing-m)] shadow-sm">
            <h2 className="text-h5 font-semibold text-foreground-900 mb-[var(--spacing-m)]">
              Feedback & Support
            </h2>
            <div className="space-y-[var(--spacing-s)]">
              <p className="text-body-small text-foreground-600">
                Haben Sie Feedback, Fragen oder Verbesserungsvorschläge? Wir freuen uns über Ihre Rückmeldung!
              </p>
              <button
                type="button"
                onClick={openFeedbackModal}
                className="w-full rounded-lg bg-primary-600 px-[var(--spacing-m)] py-[var(--spacing-s)] text-body font-medium text-white shadow-sm transition hover:bg-primary-700 text-left"
              >
                Feedback senden
              </button>
            </div>
          </div>

          {/* Lösch-Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-900/50 p-[var(--spacing-s)]">
              <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-[var(--spacing-m)]">
                <div className="flex items-center justify-between mb-[var(--spacing-m)]">
                  <h2 className="text-body font-semibold text-foreground-900">
                    Konto löschen
                  </h2>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100"
                    aria-label="Schließen"
                  >
                    <svg
                      className="h-5 w-5 sm:h-6 sm:w-6"
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
                      className="flex-1 rounded-lg bg-warning-500 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-white shadow-sm transition hover:bg-warning-600 disabled:opacity-50"
                    >
                      {isSaving ? "Löscht..." : "Konto löschen"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Modal */}
          {showFeedbackModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-900/50 p-[var(--spacing-s)]">
              <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-[var(--spacing-m)] max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-[var(--spacing-m)]">
                  <h2 className="text-body font-semibold text-foreground-900">
                    Feedback senden
                  </h2>
                  <button
                    onClick={closeFeedbackModal}
                    className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100"
                    aria-label="Schließen"
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-[var(--spacing-m)]">
                  <div>
                    <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                      Feedback-Typ <span className="text-foreground-800">*</span>
                    </label>
                    <select
                      value={feedbackForm.type}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, type: e.target.value as FeedbackData['type'] })}
                      className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      <option value="bug">Fehler melden</option>
                      <option value="improvement">Verbesserungsvorschlag</option>
                      <option value="other">Sonstiges</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                      Nachricht <span className="text-foreground-800">*</span>
                    </label>
                    <textarea
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                      required
                      minLength={10}
                      rows={6}
                      placeholder="Beschreiben Sie Ihr Feedback, Ihre Frage oder Ihren Vorschlag..."
                      className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
                    />
                    <p className="text-body-small text-foreground-600 mt-[var(--spacing-2xs)]">
                      Mindestens 10 Zeichen ({feedbackForm.message.trim().length}/10)
                    </p>
                  </div>
                  <div className="flex gap-[var(--spacing-m)] pt-[var(--spacing-s)]">
                    <button
                      type="button"
                      onClick={closeFeedbackModal}
                      className="flex-1 rounded-lg border border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={handleSendFeedback}
                      disabled={isSaving || feedbackForm.message.trim().length < 10}
                      className="flex-1 rounded-lg bg-primary-600 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Sendet..." : "Feedback senden"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Passwort ändern Modal */}
          {showPasswordModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-900/50 p-[var(--spacing-s)]">
              <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-[var(--spacing-m)] max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-[var(--spacing-m)]">
                  <h2 className="text-body font-semibold text-foreground-900">
                    Passwort ändern
                  </h2>
                  <button
                    onClick={closePasswordModal}
                    className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg text-foreground-600 transition hover:bg-background-100"
                    aria-label="Schließen"
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-[var(--spacing-m)]">
                  <div>
                    <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                      Aktuelles Passwort <span className="text-foreground-800">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      required
                      className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                  <div>
                    <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                      Neues Passwort <span className="text-foreground-800">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    <p className="text-body-small text-foreground-600 mt-[var(--spacing-2xs)]">
                      Mindestens 8 Zeichen
                    </p>
                  </div>
                  <div>
                    <label className="block text-body-small font-medium text-foreground-800 mb-[var(--spacing-2xs)]">
                      Neues Passwort bestätigen <span className="text-foreground-800">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordForm.new_password_confirmation}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-background-200 px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                  <div className="flex gap-[var(--spacing-m)] pt-[var(--spacing-s)]">
                    <button
                      type="button"
                      onClick={closePasswordModal}
                      className="flex-1 rounded-lg border border-background-200 bg-white px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-foreground-700 shadow-sm transition hover:bg-background-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={savePassword}
                      disabled={isSaving}
                      className="flex-1 rounded-lg bg-primary-600 px-[var(--spacing-s)] py-[var(--spacing-xs)] text-body-small font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
                    >
                      {isSaving ? "Speichert..." : "Passwort ändern"}
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
