# Admin-Bereich & Nutzungsanalysen – Zusammenfassung

**Stand:** Januar 2025  
**Zweck:** Schnellzugriff auf alle Admin-Funktionen und technische Übersicht.

---

## 1. Admin-Bereich öffnen

### URL (Backend)

- **Lokal:** `http://localhost:8000/admin/analytics`  
  (oder die URL Ihres Backends, z.B. `https://ihr-backend.railway.app/admin/analytics`)
- **Feedback-Übersicht:** `http://localhost:8000/feedback`  
  (gleiche Anmeldung, dann Liste aller Feedback-Meldungen)

### Anmeldung

1. Im Browser die Admin-URL aufrufen (z.B. `/admin/analytics`).
2. Es erscheint die **Admin-Login-Seite** (Passwortfeld).
3. **Passwort eingeben** und absenden.
   - **Standard-Passwort:** `admin123`
   - **Produktion:** Passwort per Umgebungsvariable setzen: `ADMIN_PASSWORD=ihr_sicheres_passwort`
4. Nach erfolgreicher Anmeldung: Sie sind im Admin-Bereich (Session bleibt aktiv).

### Abmelden

- Link **„Abmelden“** oben rechts auf der Admin-Seite, oder direkt:  
  `http://localhost:8000/admin/logout`

### Wichtige Admin-URLs (alle nach Login)

| Seite              | URL                    |
|--------------------|------------------------|
| Nutzungsstatistiken | `/admin/analytics`    |
| Feedback-Übersicht  | `/feedback`            |
| Migrationen (Pilot) | `/admin/migrate`       |
| Abmelden            | `/admin/logout`        |

---

## 2. Was Sie im Admin-Bereich sehen (Nutzungsstatistiken)

Unter **„Nutzungsstatistiken“** (`/admin/analytics`) gibt es einen **Datumsfilter** (Von / Bis). Alle folgenden Auswertungen beziehen sich auf diesen Zeitraum.

### 2.1 Registrierungen nach Rolle

- **Patienten:** Anzahl der als „Patient“ registrierten Nutzer.
- **Angehörige:** Anzahl der als „Angehöriger“ registrierten Nutzer.
- **Gesamt registriert:** Summe (nur Anzahlen, anonym).

### 2.2 API & Funktionen (bereits vorher vorhanden)

- **Gesamt Anfragen / Fehler / Erfolgsrate**
- **Meist genutzte Funktionen** (z.B. Befinden, Tagebuch, Medikamente)
- **Wenig genutzte Funktionen**

### 2.3 Beschwerden / Symptome (Befinden)

- **Am häufigsten genutzt:** Welche vordefinierten Symptome (z.B. Stress, Müdigkeit, Kopfschmerz) wie oft eingetragen wurden.
- **Im Zeitraum nie genutzt:** Vordefinierte Symptome, die in dem Zeitraum gar nicht verwendet wurden.

### 2.4 Eigene Symptome (anonym)

- **Von Benutzern selbst eingetragene Symptome** (z.B. „Kopfschmerzen morgens“).
- Es werden **nur der Anzeigename und die Nutzungshäufigkeit** im Zeitraum angezeigt – **keine Benutzerzuordnung** (anonym).
- Erscheint, sobald Nutzer eigene Symptome angelegt und damit Befinden-Einträge gespeichert haben.

### 2.5 Seitenaufrufe

- **Welche App-Seiten** (z.B. `/befinden`, `/profil`, `/diary`) **wie oft** aufgerufen wurden.
- Gesamtanzahl der Seitenaufrufe im Zeitraum.

### 2.6 Nutzungszeit in der App

- **Ø Minuten pro Tag** (nur Tage, an denen die App genutzt wurde).
- **Ø App-Öffnungen pro Woche** (wie oft die App geöffnet wurde).
- **Session-Starts im Zeitraum** (Anzahl erfasster App-Starts).

Erfassung: Beim Öffnen der App wird eine Session gestartet, beim Schließen/Tab wechseln/App wegdücken wird sie beendet (inkl. Dauer). **Nutzer müssen sich nicht extra abmelden** – Schließen wird erkannt.

---

## 3. Technische Kurzübersicht (für Entwickler)

### Backend (Laravel)

- **Tabellen:**  
  `usage_logs`, `page_views`, `user_sessions`, `custom_symptom_labels`, `befindens`
- **Ausgeblendete Funktionen:** In der Statistik „Meist/Wenig genutzte Funktionen“ werden entfernte Features ausgeblendet (z. B. `medications`). Steuerung in `AnalyticsController::EXCLUDED_FUNCTION_NAMES`.
- **Config:** `config/befinden.php` → `known_symptom_ids` (vordefinierte Symptom-IDs).
- **Routen:**  
  - Geschützt durch `AdminAuth`-Middleware (Passwort über Session).  
  - Analytics-View: `GET/POST /admin/analytics`.  
  - API-Unterrouten z.B. `/admin/analytics/api/befinden-symptoms`, `/api/page-views`, `/api/user-sessions`.

### Frontend (Next.js)

- **Session-Tracking:** `SessionTracker` startet eine Session bei Login, sendet Session-Ende bei `visibilitychange` (hidden) / `pagehide` (inkl. Dauer, `fetch` mit `keepalive`). Beim Logout wird zusätzlich `session/end` aufgerufen.
- **Seitenaufrufe:** `PageViewTracker` sendet bei jedem Routenwechsel (wenn eingeloggt) den aktuellen Pfad an `POST /api/session/page-view`.
- **Eigene Symptome:** Beim Speichern eines Befinden-Eintrags mit eigenem Symptom wird `symptom_label` mitgesendet; Backend speichert es anonym in `custom_symptom_labels`.

### Admin-Passwort ändern

- **Umgebungsvariable** (z.B. in `.env` oder Railway/Vercel):  
  `ADMIN_PASSWORD=ihr_gewaeltes_passwort`  
- Wenn nicht gesetzt: Standard ist `admin123`.

---

## 4. Checkliste „Admin öffnen“

1. Backend läuft (z.B. `php artisan serve` oder Deployment).
2. Im Browser: **`<Backend-URL>/admin/analytics`** aufrufen (z.B. `http://localhost:8000/admin/analytics`).
3. Passwort eingeben (Standard: `admin123`) und absenden.
4. Optional: Zeitraum (Von/Bis) wählen und Auswertung ansehen.
5. Abmelden: Link „Abmelden“ oder `/admin/logout`.

---

*Diese Datei können Sie bei Bedarf erweitern oder in der Projekt-Dokumentation verlinken.*
