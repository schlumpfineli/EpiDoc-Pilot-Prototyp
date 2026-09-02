import { LegalPageShell } from "@/components/LegalPageShell";
import { LEGAL_OPERATOR } from "@/lib/legal";

export default function ImpressumPage() {
  return (
    <LegalPageShell title="Impressum">
      <p>
        EpiDoc ist ein digitales Epilepsie-Tagebuch im Pilotstadium. Es ist
        kein Medizinprodukt und ersetzt keine ärztliche Beratung.
      </p>

      <h2 className="text-body font-medium text-foreground-900 pt-[var(--spacing-2xs)]">
        Angaben gemäss Schweizer Recht
      </h2>
      <p>
        EpiDoc – Digitales Epilepsie-Tagebuch (Pilot)
        <br />
        Verantwortlich: {LEGAL_OPERATOR.name}
        <br />
        {LEGAL_OPERATOR.street}
        <br />
        {LEGAL_OPERATOR.zipCity}, {LEGAL_OPERATOR.country}
        <br />
        Kontakt:{" "}
        <a href={`mailto:${LEGAL_OPERATOR.email}`} className="underline underline-offset-2 text-[#2E6F57]">
          {LEGAL_OPERATOR.email}
        </a>
      </p>

      <h2 className="text-body font-medium text-foreground-900 pt-[var(--spacing-2xs)]">
        Hosting
      </h2>
      <p>
        Frontend: Vercel. Backend und Datenbank: Railway.
      </p>

      <h2 className="text-body font-medium text-foreground-900 pt-[var(--spacing-2xs)]">
        Haftung
      </h2>
      <p>
        Die Nutzung ist freiwillig. Für die Richtigkeit der eingegebenen Daten
        ist die nutzende Person verantwortlich. Es wird keine Haftung für
        Schäden aus der Nutzung der App übernommen.
      </p>
    </LegalPageShell>
  );
}
