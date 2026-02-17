/**
 * Rollenbasierte Texte: Patient vs. Angehöriger (Beobachterperspektive)
 *
 * Schlüssel = Patienten-Text (Original, bleibt unverändert für role === 'patient')
 * Wert     = Angehörigen-Text (Beobachterperspektive für role === 'relative')
 *
 * Nur Texte, die sich tatsächlich zwischen den Rollen unterscheiden, sind hier
 * aufgeführt. Einträge mit identischem Wert gehören NICHT in diese Map.
 */

export const caregiverTexts: Readonly<Record<string, string>> = {
  // ─── Navigation ───────────────────────────────────────────────────────────
  "Wie geht es dir?": "Wie geht es der Person?",

  // ─── Befinden-Seite ───────────────────────────────────────────────────────
  "Erfasse dein Befinden täglich. Detaillierte Werte und Muster findest du in der Analyse.":
    "Erfassen Sie das Befinden täglich. Werte und Muster finden Sie in der Analyse.",
  "Deine häufigsten Beschwerden": "Häufigste Beschwerden",
  "Eigene Symptome": "Weitere Symptome",
  "Eigenes Symptom hinzugefügt": "Symptom hinzugefügt",
  "Eigenes Symptom entfernt": "Symptom entfernt",
  "Bitte gib einen Namen ein": "Bitte geben Sie einen Namen ein",

  // ─── Tagebuch-Seite ───────────────────────────────────────────────────────
  "Wähle einen Tag aus dem Kalender aus, um Anfälle einzutragen oder bereits erfasste Anfälle anzuzeigen.":
    "Wählen Sie einen Tag aus, um Anfälle einzutragen oder anzuzeigen.",
  "Hast du es vorher gespürt?": "Hat die Person es vorher gespürt?",
  "Wie ging es dir danach?": "Wie ging es der Person danach?",
  "Bitte wähle einen Anfallstyp aus der Liste oder gib einen eigenen Typ ein.":
    "Bitte wählen Sie einen Anfallstyp aus oder geben Sie einen eigenen ein.",
  "Nutze dieses Feld, wenn dein Anfallstyp nicht in der Liste steht.":
    "Nutzen Sie dieses Feld, wenn der Anfallstyp nicht in der Liste steht.",

  // ─── Verlauf / Analyse-Seite ──────────────────────────────────────────────
  "Mögliche Zusammenhänge zwischen Anfällen und deinem Befinden erkennen":
    "Mögliche Zusammenhänge zwischen Anfällen und dem Befinden erkennen",
  "Vergleiche Anfälle mit:": "Anfälle vergleichen mit:",

  // ─── Profil-Seite ─────────────────────────────────────────────────────────
  "Mein Profil": "Profil der betreuten Person",

  // ─── Einstellungen-Seite ──────────────────────────────────────────────────
  "Exportieren Sie alle Ihre Daten (Profil, Anfallstagebuch, Befinden) als PDF-Dokument. Ideal für Arztbesuche oder zur persönlichen Sicherung.":
    "Exportieren Sie alle Daten (Profil, Anfallstagebuch, Befinden) als PDF-Dokument. Ideal für Arztbesuche oder zur Sicherung.",
  "Regelmässige Erinnerung, Ihr Befinden zu dokumentieren":
    "Regelmässige Erinnerung, das Befinden zu dokumentieren",
};
