# EpiDoc - Projekt-Dokumentation

**Stand**: Januar 2025  
**Version**: 1.0 (Prototyp)

---

## Inhaltsverzeichnis

1. [Funktionsumfang für Pilot](#funktionsumfang-für-pilot)
2. [Datenmodell](#datenmodell)
3. [Kernfunktionen](#kernfunktionen)
4. [Datenschutzkonzept & Einwilligungstexte](#datenschutzkonzept--einwilligungstexte)
5. [Interne Tests & Bugfixing](#interne-tests--bugfixing)

---

## 1. Funktionsumfang für Pilot

### 1.1 Überblick

EpiDoc ist eine Gesundheits-App für Epilepsie-Patient:innen zur Verwaltung und Dokumentation von:
- **Anfällen** (Seizures)
- **Symptomen** (Befinden)
- **Medikamenten** (Medications)
- **Benutzerprofil** (User Profile)

### 1.2 Kernfunktionen im Pilot

#### ✅ Implementierte Funktionen

**Authentifizierung & Benutzerverwaltung**
- Registrierung neuer Benutzer
- Login/Logout
- Passwort zurücksetzen
- Token-basierte Authentifizierung (Laravel Sanctum)
- Benutzerprofil-Verwaltung

**Anfälle (Seizures)**
- Anfall dokumentieren mit:
  - Datum und Uhrzeit
  - Anfallstyp (mehrfach auswählbar, JSON-Array)
  - Benutzerdefinierte Anfallstypen
  - Vorgefühlte Symptome
  - Gefühlte Symptome
  - Anzahl der Anfälle
  - Dauer (Minuten und Sekunden)
  - Nachwirkungen (mehrfach auswählbar)
  - Benutzerdefinierte Nachwirkungen
  - Auslöser (Triggers, mehrfach auswählbar)
  - Benutzerdefinierte Auslöser
  - Notfallmedikation (Ja/Nein)
  - Name der Notfallmedikation
  - Video-Upload (Pfad-Speicherung)
- Anfall bearbeiten
- Anfall löschen
- Anfall-Liste anzeigen
- Anfall-Details anzeigen

**Symptome (Befinden)**
- Symptom-Eintrag erstellen mit:
  - Datum
  - Kategorie (physical, mental, lifestyle, alternative)
  - Symptom-ID (z.B. headache, stress)
  - Tageszeit (morning, noon, evening)
  - Bewertung (0-10)
  - Optionale Fragen/Antworten (JSON)
- Symptom-Einträge bearbeiten
- Symptom-Einträge löschen
- Symptom-Liste anzeigen

**Medikamente (Medications)**
- Medikament hinzufügen mit:
  - Name
  - Dosis
  - Tageszeit (morning, noon, evening, night, emergency)
  - Verschreibungsdatum
  - Kommentar
- Medikament bearbeiten
- Medikament archivieren (mit Grund)
- Medikament wiederherstellen
- Medikament löschen
- Liste aktiver Medikamente
- Liste archivierter Medikamente

**Benutzerprofil (User Profile)**
- Persönliche Daten:
  - Name
  - E-Mail
  - Telefonnummer
  - Adresse
  - Versicherungsgesellschaft
  - AHV-Nummer
- Medizinische Informationen:
  - Diagnosen (JSON-Array)
  - Ärzte (JSON-Array)
  - Kliniken (JSON-Array)
  - Apotheken (JSON-Array)
- Notfallkontakt (JSON-Array)
- E-Mail-Benachrichtigungen (JSON-Array)
- Profil bearbeiten
- Passwort ändern
- Datenexport
- Account löschen

**Zusätzliche Funktionen**
- Push-Benachrichtigungen (Subscription-Management)
- Feedback-System
- Dashboard/Übersicht
- Verlauf/Statistiken (Frontend)

#### ⚠️ Nicht im Pilot enthalten

- Termine (Appointments) - Code vorhanden, aber nicht aktiv im aktuellen Prototyp
- Dokumente (Documents) - Code vorhanden, aber nicht aktiv im aktuellen Prototyp
- Community-Features
- Erweiterte Analysen/Korrelationen
- E-Mail-Verifizierung
- Zwei-Faktor-Authentifizierung

### 1.3 Technologie-Stack

**Backend**
- Laravel (PHP)
- Laravel Sanctum (Authentifizierung)
- SQLite/PostgreSQL (Datenbank)
- RESTful API

**Frontend**
- Next.js (React/TypeScript)
- Client-seitiges Routing
- Responsive Design

**Deployment**
- Backend: Railway.app
- Frontend: Vercel
- Datenbank: PostgreSQL (Railway)

---

## 2. Datenmodell

### 2.1 Datenbank-Schema

#### Tabelle: `users`

**Hauptfelder:**
- `id` (Primary Key)
- `name` (String)
- `email` (String, Unique)
- `password` (Hashed)
- `phone` (String, Nullable)
- `role` (String: 'patient', 'relative', etc.)
- `address` (Text, Nullable)
- `insurance_company` (String, Nullable)
- `ahv_number` (String, Nullable)
- `diagnoses` (JSON, Nullable) - Array von Diagnosen
- `doctors` (JSON, Nullable) - Array von Ärzten
- `clinics` (JSON, Nullable) - Array von Kliniken
- `pharmacies` (JSON, Nullable) - Array von Apotheken
- `emergency_contact` (JSON, Nullable) - Array von Notfallkontakten
- `email_notifications` (JSON, Nullable) - Array von E-Mail-Benachrichtigungseinstellungen
- `last_login_at` (Timestamp, Nullable)
- `email_verified_at` (Timestamp, Nullable)
- `created_at`, `updated_at` (Timestamps)

**Beziehungen:**
- `hasMany` Seizure
- `hasMany` Befinden
- `hasMany` Medication
- `hasMany` Feedback
- `hasMany` PushSubscription

#### Tabelle: `seizures`

**Felder:**
- `id` (Primary Key)
- `user_id` (Foreign Key → users.id, CASCADE DELETE)
- `date` (Date)
- `type` (JSON, Nullable) - Array von Anfallstypen
- `custom_type` (String, Nullable) - Benutzerdefinierter Anfallstyp
- `felt_before` (Text, Nullable) - Vorgefühlte Symptome
- `felt_symptoms` (Text, Nullable) - Gefühlte Symptome
- `seizure_count` (Integer, Default: 1) - Anzahl der Anfälle
- `duration_minutes` (Integer, Nullable)
- `duration_seconds` (Integer, Nullable)
- `after_effects` (JSON, Nullable) - Array von Nachwirkungen
- `custom_after_effects` (Text, Nullable)
- `triggers` (JSON, Nullable) - Array von Auslösern
- `custom_triggers` (Text, Nullable)
- `emergency_med` (Boolean, Default: false)
- `emergency_med_name` (String, Nullable)
- `video_path` (String, Nullable) - Pfad zum Video
- `created_at`, `updated_at` (Timestamps)

**Indizes:**
- `['user_id', 'date']` - Für schnelle Abfragen nach Benutzer und Datum

#### Tabelle: `befindens`

**Felder:**
- `id` (Primary Key)
- `user_id` (Foreign Key → users.id, CASCADE DELETE)
- `date` (Date)
- `category_id` (String) - Kategorie: 'physical', 'mental', 'lifestyle', 'alternative'
- `symptom_id` (String) - Symptom-ID (z.B. 'headache', 'stress')
- `time_of_day` (Enum: 'morning', 'noon', 'evening')
- `rating` (Integer, Default: 5) - Bewertung 0-10
- `questions` (JSON, Nullable) - Optionale Fragen/Antworten
- `created_at`, `updated_at` (Timestamps)

**Indizes:**
- `['user_id', 'date']` - Für schnelle Abfragen nach Benutzer und Datum
- `['user_id', 'date', 'category_id']` - Für Kategorie-spezifische Abfragen

#### Tabelle: `medications`

**Felder:**
- `id` (Primary Key)
- `user_id` (Foreign Key → users.id, CASCADE DELETE)
- `name` (String) - Medikamentenname
- `dose` (String) - Dosis
- `time_of_day` (String) - 'morning', 'noon', 'evening', 'night', 'emergency'
- `prescribed_at` (Date, Nullable) - Verschreibungsdatum
- `comment` (Text, Nullable)
- `archived` (Boolean, Default: false)
- `discontinuation_reason` (Text, Nullable) - Grund für Archivierung
- `archived_at` (Timestamp, Nullable)
- `created_at`, `updated_at` (Timestamps)

**Indizes:**
- `['user_id', 'archived']` - Für schnelle Abfragen nach Benutzer und Archivierungsstatus

#### Tabelle: `feedback`

**Felder:**
- `id` (Primary Key)
- `user_id` (Foreign Key → users.id, CASCADE DELETE)
- `type` (String) - Feedback-Typ
- `message` (Text)
- `rating` (Integer, Nullable)
- `created_at`, `updated_at` (Timestamps)

#### Tabelle: `push_subscriptions`

**Felder:**
- `id` (Primary Key)
- `user_id` (Foreign Key → users.id, CASCADE DELETE)
- `endpoint` (String)
- `public_key` (String)
- `auth_token` (String)
- `created_at`, `updated_at` (Timestamps)

### 2.2 Datenmodell-Beziehungen

```
User (1) ──< (N) Seizure
User (1) ──< (N) Befinden
User (1) ──< (N) Medication
User (1) ──< (N) Feedback
User (1) ──< (N) PushSubscription
```

**Cascade Delete**: Beim Löschen eines Benutzers werden automatisch alle zugehörigen Einträge (Anfälle, Symptome, Medikamente, etc.) gelöscht.

### 2.3 Datenvalidierung

**Backend (Laravel)**
- Alle Eingaben werden über Laravel Validation validiert
- Custom Validation Rules (z.B. StrongPassword)
- Input Sanitization über Middleware
- SQL-Injection-Schutz durch Eloquent ORM (Prepared Statements)

**Frontend (TypeScript)**
- Zod-Schemas für Type-Safety
- Client-seitige Validierung vor API-Aufrufen

---

## 3. Kernfunktionen

### 3.1 Anfälle (Seizures)

#### Implementierung

**Backend:**
- Model: `app/Models/Seizure.php`
- Controller: `app/Http/Controllers/Api/SeizureController.php`
- Migration: `database/migrations/2025_12_18_095755_create_seizures_table.php`
- API-Routes: `routes/api.php` - `Route::apiResource('seizures', SeizureController::class)`

**Frontend:**
- Seite: `frontend/app/diary/page.tsx` (vermutlich)
- API-Integration: `frontend/lib/api.ts`

**Funktionen:**
- ✅ CREATE: Neuen Anfall dokumentieren
- ✅ READ: Anfall-Liste und Details abrufen
- ✅ UPDATE: Anfall bearbeiten
- ✅ DELETE: Anfall löschen
- ✅ Filterung nach Benutzer (automatisch über Authentifizierung)
- ✅ Filterung nach Datum (über API-Parameter)

**Datenfelder:**
- Datum (Pflichtfeld)
- Anfallstyp (Array, optional)
- Benutzerdefinierter Anfallstyp (optional)
- Vorgefühlte Symptome (optional)
- Gefühlte Symptome (optional)
- Anzahl der Anfälle (Standard: 1)
- Dauer in Minuten und Sekunden (optional)
- Nachwirkungen (Array, optional)
- Benutzerdefinierte Nachwirkungen (optional)
- Auslöser (Array, optional)
- Benutzerdefinierte Auslöser (optional)
- Notfallmedikation (Boolean)
- Name der Notfallmedikation (optional)
- Video-Pfad (optional)

### 3.2 Symptome (Befinden)

#### Implementierung

**Backend:**
- Model: `app/Models/Befinden.php`
- Controller: `app/Http/Controllers/Api/BefindenController.php`
- Migration: `database/migrations/2025_12_18_095754_create_befindens_table.php`
- API-Routes: `routes/api.php` - `Route::apiResource('befinden', BefindenController::class)`

**Frontend:**
- Seite: `frontend/app/befinden/page.tsx`
- API-Integration: `frontend/lib/api.ts`

**Funktionen:**
- ✅ CREATE: Neuen Symptom-Eintrag erstellen
- ✅ READ: Symptom-Einträge abrufen
- ✅ UPDATE: Symptom-Eintrag bearbeiten
- ✅ DELETE: Symptom-Eintrag löschen
- ✅ Filterung nach Benutzer (automatisch)
- ✅ Filterung nach Kategorie (optional)
- ✅ Filterung nach Datum (optional)

**Datenfelder:**
- Datum (Pflichtfeld)
- Kategorie (Pflichtfeld): 'physical', 'mental', 'lifestyle', 'alternative'
- Symptom-ID (Pflichtfeld)
- Tageszeit (Pflichtfeld): 'morning', 'noon', 'evening'
- Bewertung (Integer 0-10, Standard: 5)
- Optionale Fragen/Antworten (JSON)

### 3.3 Medikamente (Medications)

#### Implementierung

**Backend:**
- Model: `app/Models/Medication.php`
- Controller: `app/Http/Controllers/Api/MedicationController.php`
- Migration: `database/migrations/2026_01_05_213727_create_medications_table.php`
- API-Routes: `routes/api.php` - `Route::apiResource('medications', MedicationController::class)`

**Frontend:**
- Seite: `frontend/app/medikamente/page.tsx`
- API-Integration: `frontend/lib/api.ts`

**Funktionen:**
- ✅ CREATE: Neues Medikament hinzufügen
- ✅ READ: Medikamenten-Liste abrufen (aktiv und archiviert)
- ✅ UPDATE: Medikament bearbeiten
- ✅ DELETE: Medikament löschen
- ✅ ARCHIVE: Medikament archivieren (mit Grund)
- ✅ RESTORE: Medikament wiederherstellen
- ✅ Filterung nach Benutzer (automatisch)
- ✅ Filterung nach Archivierungsstatus

**Datenfelder:**
- Name (Pflichtfeld)
- Dosis (Pflichtfeld)
- Tageszeit (Pflichtfeld): 'morning', 'noon', 'evening', 'night', 'emergency'
- Verschreibungsdatum (optional)
- Kommentar (optional)
- Archiviert (Boolean, Standard: false)
- Grund für Archivierung (optional)
- Archivierungsdatum (optional)

### 3.4 Profil (User Profile)

#### Implementierung

**Backend:**
- Model: `app/Models/User.php`
- Controller: `app/Http/Controllers/AuthController.php`
- Migrationen:
  - `database/migrations/0001_01_01_000000_create_users_table.php` (Basis)
  - `database/migrations/2026_01_08_100756_add_personal_data_fields_to_users_table.php`
  - `database/migrations/2026_01_08_101135_change_disease_to_diagnoses_in_users_table.php`
  - `database/migrations/2026_01_08_104136_add_phone_to_users_table.php`
  - `database/migrations/2026_01_08_105529_add_account_settings_to_users_table.php`
  - `database/migrations/2026_01_05_213801_add_profile_fields_to_users_table.php`
- API-Routes: `routes/api.php`

**Frontend:**
- Seite: `frontend/app/profil/page.tsx`
- API-Integration: `frontend/lib/api.ts`

**Funktionen:**
- ✅ READ: Profil abrufen (`GET /api/user`)
- ✅ UPDATE: Profil bearbeiten (`PUT /api/user/profile`)
- ✅ Passwort ändern (`PUT /api/user/password`)
- ✅ E-Mail-Benachrichtigungen verwalten (`PUT /api/user/email-notifications`)
- ✅ Datenexport (`GET /api/user/export`)
- ✅ Push-Benachrichtigungen abonnieren/kündigen
- ✅ Account löschen (`DELETE /api/user`)

**Datenfelder:**

**Persönliche Daten:**
- Name
- E-Mail
- Telefonnummer
- Adresse
- Versicherungsgesellschaft
- AHV-Nummer

**Medizinische Informationen (JSON-Arrays):**
- Diagnosen
- Ärzte
- Kliniken
- Apotheken

**Kontakte:**
- Notfallkontakt (JSON-Array)

**Einstellungen:**
- E-Mail-Benachrichtigungen (JSON-Array)
- Push-Benachrichtigungen (über separate Tabelle)

### 3.5 API-Endpunkte Übersicht

**Öffentliche Routen:**
- `POST /api/register` - Registrierung
- `POST /api/login` - Login
- `POST /api/password/forgot` - Passwort vergessen
- `POST /api/password/reset` - Passwort zurücksetzen
- `POST /api/token/refresh` - Token erneuern

**Geschützte Routen (auth:sanctum):**
- `GET /api/user` - Benutzerdaten abrufen
- `PUT /api/user/profile` - Profil bearbeiten
- `PUT /api/user/password` - Passwort ändern
- `PUT /api/user/email-notifications` - E-Mail-Benachrichtigungen
- `GET /api/user/export` - Datenexport
- `POST /api/user/push/subscribe` - Push abonnieren
- `POST /api/user/push/unsubscribe` - Push kündigen
- `DELETE /api/user` - Account löschen

**Befinden (Symptome):**
- `GET /api/befinden` - Liste abrufen
- `POST /api/befinden` - Neuen Eintrag erstellen
- `GET /api/befinden/{id}` - Details abrufen
- `PUT /api/befinden/{id}` - Bearbeiten
- `DELETE /api/befinden/{id}` - Löschen

**Anfälle:**
- `GET /api/seizures` - Liste abrufen
- `POST /api/seizures` - Neuen Anfall dokumentieren
- `GET /api/seizures/{id}` - Details abrufen
- `PUT /api/seizures/{id}` - Bearbeiten
- `DELETE /api/seizures/{id}` - Löschen

**Medikamente:**
- `GET /api/medications` - Liste abrufen
- `POST /api/medications` - Neues Medikament hinzufügen
- `GET /api/medications/{id}` - Details abrufen
- `PUT /api/medications/{id}` - Bearbeiten
- `DELETE /api/medications/{id}` - Löschen
- `POST /api/medications/{id}/archive` - Archivieren
- `POST /api/medications/{id}/restore` - Wiederherstellen

**Feedback:**
- `POST /api/feedback` - Feedback senden
- `GET /api/feedback` - Feedback abrufen (Admin)

---

## 4. Datenschutzkonzept & Einwilligungstexte

### 4.1 Datenschutz-Implementierung

#### Technische Maßnahmen

**Verschlüsselung:**
- Passwörter werden mit bcrypt gehasht
- HTTPS für alle API-Kommunikation (im Produktionsbetrieb)
- Token-basierte Authentifizierung (Laravel Sanctum)

**Zugriffskontrolle:**
- Benutzer können nur auf eigene Daten zugreifen
- Middleware-Schutz für alle API-Routen
- User-Isolation auf Datenbankebene (Foreign Keys mit user_id)

**Input-Sanitization:**
- Automatische Bereinigung aller Eingaben über Middleware
- XSS-Schutz durch SanitizationHelper
- SQL-Injection-Schutz durch Eloquent ORM

**Security Headers:**
- Content Security Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy
- Permissions-Policy

**Rate Limiting:**
- Login/Register: 5 Requests pro Minute
- API-Routes: 60 Requests pro Minute
- Token-Refresh: 10 Requests pro Minute

**Logging:**
- Strukturierte Logs für alle API-Requests
- Sicherheitsrelevante Events werden geloggt
- Keine Passwörter oder sensible Daten in Logs

**Backup & Datenwiederherstellung:**
- Automatische Backups vor Migrationen
- Backup-Command: `php artisan db:backup`
- Sichere Migration: `php artisan migrate:safe`
- Backup-Retention: 30 Tage

#### Dokumentation

**Vorhandene Dokumentation:**
- `backend/SECURITY.md` - Detaillierte Sicherheitsdokumentation
- `backend/DATENSICHERHEIT.md` - Datensicherheit bei Updates

**Sicherheitsmaßnahmen (aus SECURITY.md):**
- ✅ SQL-Injection-Schutz (Prepared Statements)
- ✅ XSS-Schutz (Input Sanitization)
- ✅ Passwort-Sicherheit (bcrypt, Strong Password Rules)
- ✅ Authentifizierung & Autorisierung (Laravel Sanctum)
- ✅ Rate Limiting
- ✅ Input-Validierung
- ✅ Security Headers
- ✅ Logging & Monitoring
- ✅ Datenbank-Backup

### 4.2 Datenschutzkonzept (Konzeptionell)

#### Erhobene Daten

**Personenbezogene Daten:**
- Name
- E-Mail-Adresse
- Telefonnummer
- Adresse
- Versicherungsgesellschaft
- AHV-Nummer

**Gesundheitsdaten:**
- Diagnosen
- Anfälle (Datum, Typ, Dauer, Symptome, etc.)
- Symptome/Befinden
- Medikamente (Name, Dosis, Einnahmezeiten)
- Ärzte, Kliniken, Apotheken
- Notfallkontakte

**Technische Daten:**
- IP-Adresse (für Logging)
- User-Agent (für Logging)
- Login-Zeitpunkte
- Push-Benachrichtigungs-Subscriptions

#### Zweck der Datenverarbeitung

- Bereitstellung der App-Funktionalität
- Dokumentation von Anfällen, Symptomen und Medikamenten
- Verwaltung des Benutzerprofils
- Versand von Benachrichtigungen (optional)
- Verbesserung der App (Feedback)

#### Rechtsgrundlage (DSGVO)

- **Einwilligung** (Art. 6 Abs. 1 lit. a DSGVO) - für Gesundheitsdaten
- **Vertragserfüllung** (Art. 6 Abs. 1 lit. b DSGVO) - für Bereitstellung der App
- **Berechtigtes Interesse** (Art. 6 Abs. 1 lit. f DSGVO) - für Logging und Sicherheit

**Besondere Kategorien personenbezogener Daten (Gesundheitsdaten):**
- **Explizite Einwilligung** (Art. 9 Abs. 2 lit. a DSGVO) erforderlich

#### Datenweitergabe

**Aktuell:**
- Keine Datenweitergabe an Dritte
- Daten werden nur auf den Servern des Hosting-Providers (Railway/Vercel) gespeichert

**Zukünftig (falls geplant):**
- Export-Funktion für Benutzer (bereits implementiert: `GET /api/user/export`)
- Keine automatische Weitergabe an Dritte

#### Speicherdauer

- Daten werden gespeichert, solange der Account existiert
- Bei Account-Löschung werden alle Daten gelöscht (CASCADE DELETE)
- Backups werden 30 Tage aufbewahrt (automatische Bereinigung)

#### Betroffenenrechte (DSGVO)

**Implementiert:**
- ✅ **Auskunftsrecht** (Art. 15 DSGVO) - Datenexport über `GET /api/user/export`
- ✅ **Löschrecht** (Art. 17 DSGVO) - Account-Löschung über `DELETE /api/user`
- ✅ **Widerspruchsrecht** (Art. 21 DSGVO) - E-Mail-Benachrichtigungen können deaktiviert werden

**Noch zu implementieren:**
- ⚠️ **Berichtigungsrecht** (Art. 16 DSGVO) - Teilweise über Profil-Bearbeitung, aber keine explizite Funktion
- ⚠️ **Einschränkung der Verarbeitung** (Art. 18 DSGVO) - Nicht implementiert
- ⚠️ **Datenübertragbarkeit** (Art. 20 DSGVO) - Teilweise über Export, aber nicht im Standardformat

### 4.3 Einwilligungstexte (Vorschlag)

#### Registrierung - Datenschutzerklärung

**Textvorschlag:**

```
Datenschutzerklärung

Mit der Registrierung bei EpiDoc stimmen Sie der folgenden Datenschutzerklärung zu:

1. Erhebung und Verarbeitung von Daten
   - Ihre persönlichen Daten (Name, E-Mail, etc.) werden zur Bereitstellung der App verwendet.
   - Ihre Gesundheitsdaten (Anfälle, Symptome, Medikamente) werden nur von Ihnen erfasst und gespeichert.
   - Technische Daten (IP-Adresse, Login-Zeitpunkte) werden für Sicherheitszwecke gespeichert.

2. Zweck der Datenverarbeitung
   - Bereitstellung der App-Funktionalität
   - Dokumentation Ihrer Gesundheitsdaten
   - Versand von Benachrichtigungen (optional)

3. Speicherung und Löschung
   - Ihre Daten werden gespeichert, solange Ihr Account existiert.
   - Sie können Ihren Account jederzeit löschen (alle Daten werden dann gelöscht).

4. Ihre Rechte
   - Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Widerspruch.
   - Sie können Ihre Daten jederzeit exportieren.
   - Sie können Ihre Einwilligung jederzeit widerrufen.

5. Datenweitergabe
   - Ihre Daten werden nicht an Dritte weitergegeben.
   - Daten werden auf Servern in der EU/EWR gespeichert.

6. Kontakt
   - Bei Fragen zum Datenschutz kontaktieren Sie uns bitte unter: [Kontakt-E-Mail]

[ ] Ich habe die Datenschutzerklärung gelesen und stimme zu.
```

#### Einwilligung für Gesundheitsdaten

**Textvorschlag:**

```
Einwilligung zur Verarbeitung von Gesundheitsdaten

Gemäß Art. 9 DSGVO benötigen wir Ihre ausdrückliche Einwilligung zur Verarbeitung Ihrer Gesundheitsdaten.

Ich willige ein, dass EpiDoc folgende Gesundheitsdaten verarbeitet:
- Diagnosen
- Anfallsdokumentationen
- Symptome und Befinden
- Medikamenteninformationen
- Informationen zu Ärzten, Kliniken und Apotheken

Diese Daten werden ausschließlich zur Bereitstellung der App-Funktionalität verwendet und nicht an Dritte weitergegeben.

Sie können Ihre Einwilligung jederzeit widerrufen, indem Sie Ihren Account löschen.

[ ] Ich willige in die Verarbeitung meiner Gesundheitsdaten ein.
```

#### E-Mail-Benachrichtigungen

**Textvorschlag:**

```
E-Mail-Benachrichtigungen

Möchten Sie E-Mail-Benachrichtigungen von EpiDoc erhalten?

Sie können jederzeit in den Einstellungen festlegen, welche Benachrichtigungen Sie erhalten möchten:
- Erinnerungen an Medikamenteneinnahme
- Wöchentliche Zusammenfassungen
- Wichtige Updates zur App

[ ] Ich möchte E-Mail-Benachrichtigungen erhalten (optional)
```

### 4.4 Empfehlungen für die Implementierung

**Kurzfristig:**
- [ ] Datenschutzerklärung-Seite im Frontend erstellen
- [ ] Einwilligungs-Checkboxen bei Registrierung hinzufügen
- [ ] Impressum-Seite erstellen
- [ ] Kontakt-Seite für Datenschutzanfragen erstellen
- [ ] Cookie-Banner (falls Cookies verwendet werden)

**Mittel- bis langfristig:**
- [ ] Vollständige DSGVO-Konformität prüfen
- [ ] Datenschutz-Folgenabschätzung (DSFA) durchführen
- [ ] Auftragsverarbeitungsvertrag (AVV) mit Hosting-Provider prüfen
- [ ] Datenschutzbeauftragten benennen (falls erforderlich)
- [ ] Regelmäßige Datenschutz-Audits

---

## 5. Interne Tests & Bugfixing

### 5.1 Test-Infrastruktur

#### Backend-Tests

**Framework:** PHPUnit

**Test-Dateien:**
- `tests/TestCase.php` - Basis-Test-Klasse
- `tests/Feature/` - Feature-Tests (8 Dateien)
- `tests/Unit/` - Unit-Tests (2 Dateien)

**Test-Kategorien:**
- Authentifizierung
- API-Endpunkte
- Datenvalidierung
- Sicherheit

**Ausführung:**
```bash
cd backend
php artisan test
```

#### Frontend-Tests

**Framework:** Vitest (Unit-Tests), Playwright (E2E-Tests)

**Test-Dateien:**
- `frontend/components/auth/ProtectedRoute.test.tsx`
- `frontend/components/ui/Button.test.tsx`
- `frontend/components/ui/Input.test.tsx`
- `frontend/e2e/` - E2E-Tests (5 Dateien)

**Ausführung:**
```bash
cd frontend
npm test          # Unit-Tests
npm run test:e2e  # E2E-Tests
```

### 5.2 Test-Dokumentation

**Vorhandene Dokumentation:**
- `TEST_ANLEITUNG.md` - Umfassende Test-Anleitung für Beta-Tester
- `backend/TEST_BENUTZER.md` - Test-Benutzer-Dokumentation
- `backend/DEMO_DATEN.md` - Demo-Daten-Dokumentation
- `backend/FEEDBACK_ANSCHAUEN.md` - Feedback-System-Dokumentation

### 5.3 Test-Szenarien

#### 1. Authentifizierung

**Test-Cases:**
- [ ] Registrierung mit gültigen Daten
- [ ] Registrierung mit ungültigen Daten (schwaches Passwort, existierende E-Mail)
- [ ] Login mit gültigen Credentials
- [ ] Login mit ungültigen Credentials
- [ ] Passwort zurücksetzen
- [ ] Token-Refresh
- [ ] Logout
- [ ] Zugriff auf geschützte Routen ohne Token

**Test-Accounts:**
- `test@example.com` / `Password123` (Patient, mit Demo-Daten)
- `patient@test.de` / `Password123` (Patient, mit Demo-Daten)
- `angehoeriger@test.de` / `Password123` (Angehöriger, ohne Demo-Daten)

#### 2. Anfälle (Seizures)

**Test-Cases:**
- [ ] Neuen Anfall dokumentieren (alle Felder)
- [ ] Neuen Anfall dokumentieren (minimale Felder)
- [ ] Anfall bearbeiten
- [ ] Anfall löschen
- [ ] Anfall-Liste abrufen
- [ ] Anfall-Details abrufen
- [ ] Filterung nach Datum
- [ ] Zugriff auf fremde Anfälle (sollte fehlschlagen)

#### 3. Symptome (Befinden)

**Test-Cases:**
- [ ] Neuen Symptom-Eintrag erstellen
- [ ] Symptom-Eintrag bearbeiten
- [ ] Symptom-Eintrag löschen
- [ ] Symptom-Liste abrufen
- [ ] Filterung nach Kategorie
- [ ] Filterung nach Datum
- [ ] Zugriff auf fremde Einträge (sollte fehlschlagen)

#### 4. Medikamente (Medications)

**Test-Cases:**
- [ ] Neues Medikament hinzufügen
- [ ] Medikament bearbeiten
- [ ] Medikament archivieren (mit Grund)
- [ ] Medikament wiederherstellen
- [ ] Medikament löschen
- [ ] Liste aktiver Medikamente abrufen
- [ ] Liste archivierter Medikamente abrufen
- [ ] Zugriff auf fremde Medikamente (sollte fehlschlagen)

#### 5. Profil (User Profile)

**Test-Cases:**
- [ ] Profil abrufen
- [ ] Profil bearbeiten
- [ ] Passwort ändern
- [ ] E-Mail-Benachrichtigungen verwalten
- [ ] Datenexport
- [ ] Push-Benachrichtigungen abonnieren/kündigen
- [ ] Account löschen
- [ ] Zugriff auf fremdes Profil (sollte fehlschlagen)

#### 6. Sicherheit

**Test-Cases:**
- [ ] SQL-Injection-Versuche
- [ ] XSS-Versuche
- [ ] CSRF-Versuche
- [ ] Rate Limiting (zu viele Requests)
- [ ] Zugriff ohne Authentifizierung
- [ ] Zugriff auf fremde Daten

### 5.4 Bekannte Probleme & Bugfixing

#### Dokumentation vorhanden

**Bekannte Probleme:**
- `EpiDoc/BEKANNTE_PROBLEME.md` - Liste bekannter Probleme

**Troubleshooting:**
- `TROUBLESHOOTING.md` - Allgemeine Problembehebung
- `RAILWAY_TROUBLESHOOTING.md` - Railway-spezifische Probleme

#### Bugfixing-Prozess

**1. Bug identifizieren:**
- Durch Tests
- Durch Beta-Tester-Feedback
- Durch Logs

**2. Bug dokumentieren:**
- In GitHub Issues (falls verwendet)
- In `BEKANNTE_PROBLEME.md`
- Mit Reproduktionsschritten

**3. Bug beheben:**
- Code-Änderungen
- Tests schreiben/aktualisieren
- Dokumentation aktualisieren

**4. Bug verifizieren:**
- Tests ausführen
- Manuelle Tests
- Beta-Tester informieren

### 5.5 Feedback-System

**Implementierung:**
- Model: `app/Models/Feedback.php`
- Controller: `app/Http/Controllers/FeedbackController.php`
- API-Route: `POST /api/feedback`
- Dokumentation: `backend/FEEDBACK_ANSCHAUEN.md`

**Funktionen:**
- ✅ Feedback senden (Typ, Nachricht, Bewertung)
- ✅ Feedback abrufen (Admin)
- ✅ Feedback wird mit Benutzer-ID verknüpft

**Verwendung:**
- Beta-Tester können Feedback direkt in der App geben
- Feedback wird in der Datenbank gespeichert
- Admin kann Feedback einsehen

### 5.6 Test-Checkliste für Pilot-Release

**Vor dem Release:**
- [ ] Alle Unit-Tests bestehen
- [ ] Alle Feature-Tests bestehen
- [ ] E2E-Tests für kritische Pfade bestehen
- [ ] Manuelle Tests aller Kernfunktionen
- [ ] Sicherheitstests durchgeführt
- [ ] Performance-Tests (optional)
- [ ] Browser-Kompatibilität getestet
- [ ] Mobile-Responsiveness getestet
- [ ] Datenschutz-Checkliste abgearbeitet
- [ ] Dokumentation aktualisiert

**Nach dem Release:**
- [ ] Monitoring einrichten
- [ ] Fehler-Logging aktiv
- [ ] Feedback-Mechanismus funktioniert
- [ ] Backup-System getestet
- [ ] Rollback-Plan vorhanden

---

## 6. Zusammenfassung

### 6.1 Implementierungsstatus

**✅ Vollständig implementiert:**
- Authentifizierung & Benutzerverwaltung
- Anfälle (Seizures) - CRUD
- Symptome (Befinden) - CRUD
- Medikamente (Medications) - CRUD + Archivierung
- Benutzerprofil - Verwaltung + Export
- Feedback-System
- Push-Benachrichtigungen (Subscription)
- Sicherheitsmaßnahmen (SQL-Injection, XSS, Rate Limiting, etc.)
- Backup-System

**⚠️ Teilweise implementiert:**
- Datenschutzkonzept (technisch vorhanden, rechtliche Texte fehlen)
- Tests (Grundgerüst vorhanden, aber nicht vollständig)

**❌ Nicht implementiert:**
- Termine (Appointments) - Code vorhanden, aber nicht aktiv
- Dokumente (Documents) - Code vorhanden, aber nicht aktiv
- E-Mail-Verifizierung
- Zwei-Faktor-Authentifizierung
- Vollständige DSGVO-Konformität (rechtliche Texte)

### 6.2 Nächste Schritte

**Kurzfristig (für Pilot):**
1. Datenschutzerklärung und Einwilligungstexte implementieren
2. Impressum erstellen
3. Vollständige Test-Suite ausführen
4. Bekannte Bugs beheben
5. Beta-Testing durchführen

**Mittel- bis langfristig:**
1. E-Mail-Verifizierung implementieren
2. Termine und Dokumente aktivieren (falls gewünscht)
3. Erweiterte Analysen/Korrelationen
4. Vollständige DSGVO-Konformität
5. Performance-Optimierungen

---

**Dokument erstellt:** Januar 2025  
**Letzte Aktualisierung:** Januar 2025  
**Version:** 1.0

