import { LegalPageShell } from "@/components/LegalPageShell";

export default function DatenschutzPage() {
  return (
    <LegalPageShell title="Datenschutzerklärung">
      <p>
        Diese Erklärung beschreibt, wie EpiDoc im Pilot personenbezogene Daten
        und Gesundheitsdaten verarbeitet. Die App dient der persönlichen
        Dokumentation und ersetzt keine ärztliche Beratung, Diagnose oder
        Behandlung.
      </p>

      <h2 className="text-body font-medium text-foreground-900 pt-[var(--spacing-2xs)]">
        Verantwortliche Stelle
      </h2>
      <p>
        Betreiberin des Pilots ist die im{" "}
        <a href="/impressum" className="underline underline-offset-2 text-[#2E6F57]">
          Impressum
        </a>{" "}
        genannte Person. Fragen zum Datenschutz:{" "}
        <a href="mailto:epidoc@kontakt.ch" className="underline underline-offset-2 text-[#2E6F57]">
          epidoc@kontakt.ch
        </a>
        .
      </p>

      <h2 className="text-body font-medium text-foreground-900 pt-[var(--spacing-2xs)]">
        Welche Daten wir verarbeiten
      </h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Konto: E-Mail-Adresse, Passwort-Hash, Rolle, User-ID</li>
        <li>
          Gesundheitsdaten: Anfälle, Befinden, Medikamente, Diagnosen, freies
          Gedankentagebuch
        </li>
        <li>
          Technische Daten: Login-Zeitpunkte, Nutzungsereignisse (falls Tracking
          aktiv ist), Server-Logs
        </li>
      </ul>
      <p>
        Im Pilot wird kein Klartext-Name erhoben. Die Anzeige erfolgt als
        User-ID (z. B. User-123).
      </p>

      <h2 className="text-body font-medium text-foreground-900 pt-[var(--spacing-2xs)]">
        Zweck und Rechtsgrundlage
      </h2>
      <p>
        Zweck ist der Betrieb des digitalen Tagebuchs. Rechtsgrundlage für das
        Konto ist die Vertragserfüllung bzw. die Durchführung des Pilots. Für
        Gesundheitsdaten (besondere Kategorien nach Art. 9 DSGVO / Art. 5 DSG)
        ist deine ausdrückliche Einwilligung bei der Registrierung erforderlich.
        Du kannst sie jederzeit widerrufen, indem du das Konto löschst.
      </p>

      <h2 className="text-body font-medium text-foreground-900 pt-[var(--spacing-2xs)]">
        Speicherung und Sicherheit
      </h2>
      <p>
        Die Verbindung läuft über HTTPS. Passwörter werden gehasht (bcrypt)
        gespeichert. Gesundheitsdaten liegen in der Datenbank des
        Hosting-Anbieters und sind nur mit gültigem Login über die API
        abrufbar. Es findet keine feldweise Verschlüsselung der Tagebucheinträge
        statt.
      </p>
      <p>
        Frontend: Vercel. Backend und Datenbank: Railway (PostgreSQL). Diese
        Anbieter verarbeiten Daten als Auftragsverarbeiter in dem Umfang, der
        für Hosting und Betrieb nötig ist.
      </p>

      <h2 className="text-body font-medium text-foreground-900 pt-[var(--spacing-2xs)]">
        Weitergabe
      </h2>
      <p>
        Es findet keine Weitergabe an Dritte zu Werbe- oder Analysezwecken
        statt, ausser an die genannten Hosting-Anbieter. Es erfolgt kein Verkauf
        von Daten.
      </p>

      <h2 className="text-body font-medium text-foreground-900 pt-[var(--spacing-2xs)]">
        Speicherdauer und deine Rechte
      </h2>
      <p>
        Daten bleiben gespeichert, solange das Konto besteht. In den
        Einstellungen kannst du einen Export anfordern und das Konto inkl.
        aller Einträge löschen. Du hast Rechte auf Auskunft, Berichtigung,
        Löschung und Widerruf der Einwilligung.
      </p>
      <p className="text-[11px] text-foreground-500">
        Stand: September 2026. Dieser Text beschreibt den technischen Stand des
        Pilots und ersetzt keine anwaltliche Prüfung.
      </p>
    </LegalPageShell>
  );
}
