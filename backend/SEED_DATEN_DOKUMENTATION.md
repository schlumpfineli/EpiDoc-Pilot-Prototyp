# Seed-Daten für Epilepsie-App

## Übersicht

Die Seed-Daten wurden speziell für Demo- und UX-Testzwecke entwickelt. Sie zeigen **plausible Zusammenhänge** ohne medizinische Kausalität zu behaupten.

## Grundprinzipien

- **Wenige, klare Muster** statt zufälliger Verteilung
- **Anfälle passen zeitlich zu Befinden-Daten**
- **Realistische Unregelmäßigkeiten** (keine perfekten Korrelationen)
- **Keine täglichen Extremwerte**

## Zeitraum

- **6 Monate (180 Tage)** rückwirkend vom aktuellen Datum
- **Tägliche Befinden-Einträge** für alle drei Symptome
- **4–6 Anfälle pro Monat** (24–36 über den gesamten Zeitraum)

## Befinden-Symptome

Alle drei Symptome werden **täglich** erfasst:

1. **Schlaf-Wach-Rhythmus** (`sleep-rhythm`)
   - Kategorie: `lifestyle`
   - Skala: 1-10 (höher = schlechter)

2. **Stress** (`stress`)
   - Kategorie: `mental`
   - Skala: 1-10

3. **Innere Unruhe** (`restlessness`)
   - Kategorie: `mental`
   - Skala: 1-10

## Muster

### Schlaf-Wach-Rhythmus

- **1–2 Tage NACH einem Anfall**: Schlechter (Rating 6–8)
- **Am Anfallstag**: Leicht schlechter (4–6)
- **Ansonsten**: Grundniveau (2–4)

### Stress

- **Direkt VOR dem Anfall** (1 Tag davor): Erhöht (6–8)
- **Am Anfallstag**: Noch erhöht (5–7)
- **Ansonsten**: Grundniveau (2–4)

### Innere Unruhe

- **2–3 Tage VOR dem Anfall**: Erhöht (6–8)
- **1 Tag vor Anfall**: Erhöht (5–7)
- **1–2 Tage nach Anfall**: Fällt wieder ab (3–5)
- **Ansonsten**: Grundniveau (2–4)

## Anfälle

- **Anzahl**: 4–6 pro Monat (24–36 über 6 Monate)
- **Abstand**: Mindestens 3 Tage zwischen Anfällen
- **Typ**: Fokal oder Absence (zufällig)
- **Mehrheit einzelne Anfälle** (seizure_count = 1), **ab und zu Serien** (2–3 Anfälle an einem Tag)
- **Dauer**: 1–8 Minuten
- **Notfallmedikation**: ca. 20 % Chance

## Verwendung

### 1. Datenbank-Seeding

Die Seed-Daten werden automatisch generiert, wenn der `DatabaseSeeder` ausgeführt wird:

```bash
php artisan db:seed
```

Die Daten werden nur für Test-Benutzer generiert:
- `test@example.com`
- `patient@test.de`
- `angehoeriger@test.de`

**Wichtig**: Die Daten werden nur generiert, wenn noch keine Daten vorhanden sind.

### 2. JSON-Export

Um die Seed-Daten als JSON zu exportieren:

```bash
php backend/scripts/generate-seed-data.php > seed-data.json
```

Die JSON-Datei enthält:
- `metadata`: Informationen über die generierten Daten
- `seizures`: Array aller Anfall-Einträge
- `befinden`: Array aller Befinden-Einträge mit Tagesinformationen

## Datenstruktur

### Befinden-Eintrag

```json
{
  "date": "2025-12-27",
  "day": 0,
  "days_before_seizure": 9,
  "days_after_seizure": null,
  "symptoms": [
    {
      "symptom_id": "restlessness",
      "symptom_label": "Innere Unruhe",
      "category_id": "mental",
      "time_of_day": "evening",
      "rating": 1
    }
  ]
}
```

### Anfall-Eintrag

```json
{
  "date": "2025-12-27",
  "day": 0,
  "seizure_count": 1,
  "duration_minutes": 1,
  "duration_seconds": 21,
  "emergency_med": false,
  "type": "generalized"
}
```

## Ziel der Seed-Daten

Die Daten sollen:

✅ **In der Analyse-Ansicht erkennbare Muster zeigen**
- Schlaf-Wach-Rhythmus ist 1–2 Tage nach einem Anfall schlechter
- Stress ist direkt vor einem Anfall erhöht
- Innere Unruhe ist 2–3 Tage vor einem Anfall erhöht
- Nach Anfällen normalisiert sich das Befinden

✅ **Verständlich sein für Laien**
- Klare, nachvollziehbare Zusammenhänge
- Keine komplexen medizinischen Begriffe

✅ **Glaubwürdig wirken für medizinische Nutzer**
- Realistische Werte und Schwankungen
- Keine perfekten Korrelationen

✅ **Zeigen, warum die App Mehrwert bietet**
- Mustererkennung wird möglich
- Frühwarnsignale werden sichtbar

## Anpassung

Die Seed-Daten können in `backend/database/seeders/DatabaseSeeder.php` angepasst werden:

- **Anzahl der Anfälle**: `$seizureCount = rand(24, 36);` (4–6 pro Monat)
- **Zeitraum**: `$totalDays = 180;` (6 Monate)
- **Muster**: Funktion `calculateRating()` (Schlaf 1–2 Tage nach Anfall, Stress vor Anfall, Unruhe 2–3 Tage vor Anfall)

## Wichtige Hinweise

⚠️ **Keine medizinische Kausalität**: Die Daten zeigen plausible Zusammenhänge, behaupten aber keine medizinische Kausalität.

⚠️ **Nur für Demo-Zwecke**: Die Seed-Daten sind für Demo- und Testzwecke gedacht, nicht für medizinische Analysen.

⚠️ **Realismus mit Vorsicht**: Die Muster sind vereinfacht und sollen nur die Funktionalität der App demonstrieren.

