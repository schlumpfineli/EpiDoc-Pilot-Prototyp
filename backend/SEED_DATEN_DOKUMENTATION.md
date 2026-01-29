# Seed-Daten für Epilepsie-App

## Übersicht

Die Seed-Daten wurden speziell für Demo- und UX-Testzwecke entwickelt. Sie zeigen **plausible Zusammenhänge** ohne medizinische Kausalität zu behaupten.

## Grundprinzipien

- **Wenige, klare Muster** statt zufälliger Verteilung
- **Anfälle passen zeitlich zu Befinden-Daten**
- **Realistische Unregelmäßigkeiten** (keine perfekten Korrelationen)
- **Keine täglichen Extremwerte**

## Zeitraum

- **30 Tage** rückwirkend vom aktuellen Datum
- **Tägliche Befinden-Einträge**
- **3-5 Anfälle** im gesamten Zeitraum

## Befinden-Symptome

### Pflicht-Symptom
1. **Innere Unruhe** (`restlessness`)
   - Kategorie: `mental`
   - Skala: 1-10

### Optionale Symptome (max. 2)
2. **Schlaf-Wach-Rhythmus** (`sleep-rhythm`)
   - Kategorie: `lifestyle`
   - Skala: 1-10
   - Wird zufällig aktiviert (50% Chance)

3. **Stress** (`stress`)
   - Kategorie: `mental`
   - Skala: 1-10
   - Wird zufällig aktiviert (50% Chance)

## Muster

### Innere Unruhe (Hauptmuster)

**Grundniveau:**
- Meist niedrige bis mittlere Werte (2-4)
- Natürliche Schwankungen (±1)

**Vor einem Anfall:**
- **2-4 Tage vor Anfall**: Deutlicher Anstieg (6-8)
- **1 Tag vor Anfall**: Kann hoch bleiben oder leicht fallen (5-7)

**Nach einem Anfall:**
- **Am Tag des Anfalls**: Kann noch erhöht sein (5-7)
- **1-2 Tage nach Anfall**: Fällt wieder ab (3-5)

### Schlaf-Wach-Rhythmus (Begleitmuster)

- **In Phasen erhöhter Unruhe** (2-4 Tage vor Anfall): Leicht erhöht (4-6)
- **Nach Anfall** (0-1 Tage): Kann leicht erhöht sein (3-5)
- **Ansonsten**: Grundniveau (2-4)

### Stress (Begleitmuster)

- **In Phasen erhöhter Unruhe** (2-4 Tage vor Anfall): 50% Chance auf erhöhten Stress (5-7)
- **Ansonsten**: Grundniveau (2-4)

## Anfälle

- **Anzahl**: 3-5 Anfälle über 30 Tage
- **Abstand**: Mindestens 5 Tage zwischen Anfällen
- **Verteilung**: Gleichmäßig über den Zeitraum verteilt
- **Typ**: Focal oder Generalized (zufällig)
- **Dauer**: 1-8 Minuten
- **Notfallmedikation**: 25% Chance

### Optional: 1 Anfall ohne klares Muster

Für zusätzlichen Realismus kann ein Anfall ohne klares Befinden-Muster auftreten.

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
- Innere Unruhe steigt vor Anfällen deutlich an
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

- **Anzahl der Anfälle**: Ändere `$seizureCount = rand(3, 5);`
- **Zeitraum**: Ändere die Schleife `for ($day = 0; $day < 30; $day++)`
- **Symptome**: Passe das Array `$symptoms` an
- **Muster**: Passe die Funktion `calculateRating()` an

## Wichtige Hinweise

⚠️ **Keine medizinische Kausalität**: Die Daten zeigen plausible Zusammenhänge, behaupten aber keine medizinische Kausalität.

⚠️ **Nur für Demo-Zwecke**: Die Seed-Daten sind für Demo- und Testzwecke gedacht, nicht für medizinische Analysen.

⚠️ **Realismus mit Vorsicht**: Die Muster sind vereinfacht und sollen nur die Funktionalität der App demonstrieren.

