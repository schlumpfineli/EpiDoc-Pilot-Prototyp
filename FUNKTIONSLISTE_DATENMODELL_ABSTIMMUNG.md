# Funktionsliste & Datenmodell - Abstimmung (Pilotprojekt)

**Stand**: Januar 2025  
**Version**: 1.0 (Prototyp)  
**Pilotphase**: 3 Monate  
**Status**: ✅ Abgestimmt für Pilotphase

---

## Zusammenfassung

Die Funktionsliste und das Datenmodell der EpiDoc-App sind vollständig aufeinander abgestimmt **für die 3-monatige Pilotphase**. Alle implementierten Funktionen haben entsprechende Datenstrukturen im Datenmodell, und alle Datenfelder werden durch die Funktionsliste abgedeckt. Für die Pilotphase sind zusätzliche Anpassungen für Datenschutz (Pseudonyme Namen) und Admin-Zugriff auf anonymisierte Daten geplant.

---

## 1. Datenmodell-Übersicht

### 1.1 Kern-Tabellen

Das Datenmodell besteht aus **7 Haupttabellen**, die alle Funktionsbereiche abdecken:

#### **Users** (Benutzer)
- **Zweck**: Zentrale Benutzerverwaltung und Authentifizierung
- **Felder**: 
  - Authentifizierung: `name`, `email`, `password`, `role`
  - Persönliche Daten: `phone`, `address`, `insurance_company`, `ahv_number`
  - Medizinische Daten: `diagnoses` (JSON), `doctors` (JSON), `clinics` (JSON), `pharmacies` (JSON)
  - Notfallkontakt: `emergency_contact` (JSON)
  - Einstellungen: `email_notifications` (JSON), `last_login_at`
- **Beziehungen**: 
  - `hasMany` → Befindens, Seizures, Medications, Feedback, PushSubscriptions

#### **Befindens** (Befindlichkeits-Einträge)
- **Zweck**: Tägliche Symptom-Dokumentation
- **Felder**: 
  - `user_id` (Foreign Key), `date`, `category_id`, `symptom_id`
  - `time_of_day` (morning/noon/evening)
  - `rating` (0-10), `questions` (JSON), `observation` (Text)
- **Indizes**: `[user_id, date]`, `[user_id, date, category_id]`
- **Funktionsabdeckung**: ✅ Vollständig durch Befinden-Tracking-Funktionen

#### **Seizures** (Anfälle)
- **Zweck**: Dokumentation epileptischer Anfälle
- **Felder**: 
  - `user_id` (Foreign Key), `date`
  - Anfallstypen: `type` (JSON-Array), `custom_type`
  - Symptome: `felt_before`, `felt_symptoms`
  - Quantität: `seizure_count`, `duration_minutes`, `duration_seconds`
  - Nachwirkungen: `after_effects` (JSON), `custom_after_effects`
  - Auslöser: `triggers` (JSON), `custom_triggers`
  - Notfallmedikation: `emergency_med` (Boolean), `emergency_med_name`
  - Medien: `video_path`
- **Indizes**: `[user_id, date]`
- **Funktionsabdeckung**: ✅ Vollständig durch Anfallstagebuch-Funktionen

#### **Medications** (Medikamente)
- **Zweck**: Medikamenten-Verwaltung und Zeitanalyse
- **Felder**: 
  - `user_id` (Foreign Key), `name`, `dose`
  - Zeitmanagement: `time_of_day`, `prescribed_at`, `start_date`, `end_date`
  - Einnahmetyp: `intake_type` (regular/irregular), `emergency_medication` (Boolean)
  - Status: `archived`, `archived_at`, `discontinuation_reason`
  - Zusatzinfo: `comment`
- **Indizes**: `[user_id, archived]`
- **Funktionsabdeckung**: ✅ Vollständig durch Medikamenten-Verwaltung
- **Besonderheiten**: 
  - Methoden für Zeitanalyse (`isActive()`, `isSuitableForAnalysis()`)
  - Unterstützung für Medikamenten-Effektivitäts-Analysen

#### **Feedback**
- **Zweck**: Benutzer-Feedback-System
- **Felder**: `user_id`, `type`, `message`, `page_url`, `user_agent`
- **Funktionsabdeckung**: ✅ Vollständig durch Feedback-Funktion

#### **PushSubscriptions**
- **Zweck**: Push-Benachrichtigungen
- **Felder**: `user_id`, `endpoint`, `public_key`, `auth_token`, `content_encoding`
- **Funktionsabdeckung**: ✅ Vollständig durch Push-Notification-System

#### **UsageLogs**
- **Zweck**: API-Nutzungsprotokollierung für Analytics
- **Felder**: `endpoint`, `method`, `status_code`, `function_name`, `date`
- **Indizes**: `[function_name, date]`, `[endpoint, date]`, `[date]`
- **Funktionsabdeckung**: ✅ Vollständig durch Admin-Analytics

---

## 2. Funktionsliste & Datenmodell-Abstimmung

### 2.1 ✅ Vollständige Abdeckung

**Authentifizierung & Benutzerverwaltung**
- ✅ Registrierung → `users` Tabelle
- ✅ Login → `users` Tabelle + Sanctum Tokens
- ✅ Profil-Verwaltung → `users` Tabelle (alle Felder)
- ✅ Passwort ändern → `users.password`
- ✅ Account löschen → `users` + CASCADE DELETE aller zugehörigen Daten

**Anfälle (Seizures)**
- ✅ Anfall dokumentieren → `seizures` Tabelle (alle Felder vorhanden)
- ✅ Anfall bearbeiten → `seizures` UPDATE
- ✅ Anfall löschen → `seizures` DELETE
- ✅ Anfall-Liste → `seizures` SELECT mit Filterung
- ✅ Filter nach Datum → `seizures.date` Index vorhanden
- ✅ Video-Upload → `seizures.video_path` vorhanden

**Symptome (Befinden)**
- ✅ Symptom-Eintrag erstellen → `befindens` Tabelle (alle Felder vorhanden)
- ✅ Symptom bearbeiten → `befindens` UPDATE
- ✅ Symptom löschen → `befindens` DELETE
- ✅ Symptom-Liste → `befindens` SELECT mit Filterung
- ✅ Filter nach Kategorie → `befindens.category_id` Index vorhanden
- ✅ Filter nach Datum → `befindens.date` Index vorhanden
- ✅ Beobachtungen → `befindens.observation` vorhanden

**Medikamente (Medications)**
- ✅ Medikament hinzufügen → `medications` Tabelle (alle Felder vorhanden)
- ✅ Medikament bearbeiten → `medications` UPDATE
- ✅ Medikament archivieren → `medications.archived` + `archived_at`
- ✅ Medikament wiederherstellen → `medications.archived` = false
- ✅ Medikament löschen → `medications` DELETE
- ✅ Zeitanalyse → `medications.start_date`, `end_date`, `intake_type`
- ✅ Notfallmedikation → `medications.emergency_medication` Flag

**Zusätzliche Funktionen**
- ✅ Push-Benachrichtigungen → `push_subscriptions` Tabelle
- ✅ Feedback-System → `feedback` Tabelle
- ✅ Analytics → `usage_logs` Tabelle

### 2.2 Datenintegrität & Beziehungen

**Foreign Key Constraints**
- ✅ Alle Tabellen haben `user_id` Foreign Key mit `CASCADE DELETE`
- ✅ Bei Benutzer-Löschung werden alle zugehörigen Daten automatisch gelöscht
- ✅ Datenintegrität ist gewährleistet

**Indizes für Performance**
- ✅ `users.email` → Unique Index (für Login-Performance)
- ✅ `befindens[user_id, date]` → Composite Index (für schnelle Abfragen)
- ✅ `seizures[user_id, date]` → Composite Index
- ✅ `medications[user_id, archived]` → Composite Index
- ✅ `usage_logs[function_name, date]` → Composite Index (für Analytics)

**JSON-Felder für Flexibilität**
- ✅ `users.diagnoses` → Array von Diagnosen
- ✅ `users.doctors`, `clinics`, `pharmacies` → Arrays für mehrere Einträge
- ✅ `seizures.type`, `after_effects`, `triggers` → Arrays für Mehrfachauswahl
- ✅ `befindens.questions` → Flexible Frage-Antwort-Struktur

---

## 3. Geplante Erweiterungen für Pilotphase

### 3.1 Admin-Zugriff auf anonymisierte Daten

**Anforderung**: Admin muss auf Befinden- und Anfallsdaten zugreifen können, ohne personenbezogene Daten zu sehen.

**Geplante Umsetzung**:
- ✅ Anonymisierungslogik implementieren (Hash-basierte anonyme User-IDs)
- ✅ Admin-Controller für anonymisierte Befinden-Daten
- ✅ Admin-Controller für anonymisierte Seizure-Daten
- ✅ API-Routen: `/api/admin/befinden`, `/api/admin/seizures`
- ✅ Datenfilterung: Entfernen von `user_id`, `name`, `email`, etc.
- ✅ Behalten: Medizinische Daten, anonymisierte User-ID, Zeitstempel

**Datenmodell-Anpassung**: 
- Keine DB-Änderung nötig (Hash-basiert)
- Optional: `users.anonymous_id` Spalte für sequenzielle anonyme IDs

### 3.2 Multi-User-Vergleiche und Analysen

**Anforderung**: Admin muss Daten von mehreren Benutzern vergleichen können, um Zusammenhänge zu finden.

**Geplante Umsetzung**:
- ✅ Aggregierte Statistiken über alle Benutzer
- ✅ Vergleichs-Dashboard mit Visualisierungen
- ✅ Korrelations-Analysen (automatisch)
- ✅ Gruppierungs-Funktionen (nach Diagnose, Medikamenten, etc.)
- ✅ Mustererkennung (Pattern Detection)
- ✅ Export-Funktionen für externe Analyse

**Datenmodell-Anpassung**:
- Keine DB-Änderung nötig
- Analytics-Queries auf bestehenden Tabellen
- Optional: Separate Analytics-Tabellen für aggregierte Daten

### 3.3 Datenschutz-Anpassungen für Pilotphase

**Pseudonyme Namen**
- ✅ Registrierung: Feld "Anzeigename" statt "Name"
- ✅ Hinweis: "Verwenden Sie einen Pseudonym-Namen für die Pilotphase"
- ✅ `users.name` wird als Display-Name behandelt
- ✅ Keine DB-Änderung nötig (nur UI/UX-Anpassung)

**E-Mail-Handling**
- ✅ E-Mail bleibt ungehasht (für Login notwendig)
- ✅ E-Mail nicht in Logs/Exports/Analytics verwenden
- ✅ Nach Pilotphase: E-Mail-Adressen löschen/anonymisieren
- ✅ Keine DB-Änderung nötig (nur Logik-Anpassung)

---

## 4. Sicherheitsvorkehrungen & Datenmodell

### 4.1 User-Isolation

**Implementierung**:
- ✅ Alle Controller prüfen `user_id` vor Datenzugriff
- ✅ Middleware `auth:sanctum` für alle API-Routen
- ✅ Datenbankebene: Foreign Keys mit `user_id`
- ✅ Query-Scopes: Automatische Filterung nach `user_id`

**Beispiel**:
```php
// BefindenController
$befinden = Befinden::where('user_id', $user->id)->findOrFail($id);
```

### 4.2 Datenverschlüsselung (Pilotphase)

**Für Pilotphase ausreichend**:
- ✅ Passwörter: bcrypt-Hashing
- ⚠️ Sensible Daten (AHV-Nummer, Diagnosen): Unverschlüsselt (akzeptabel für Pilotphase)
- ✅ Pseudonyme Namen reduzieren Risiko
- ✅ E-Mail nicht in Logs/Exports

**Hinweis**: Für Produktion später Verschlüsselung für sensible Daten erforderlich.

### 4.3 Audit-Logging (Pilotphase)

**Für Pilotphase**:
- ✅ `usage_logs` Tabelle für API-Nutzung vorhanden
- ⚠️ Keine Admin-Zugriffs-Logs (für Pilotphase ausreichend)

**Hinweis**: Für Produktion später separate Admin-Zugriffs-Logs erforderlich.

---

## 5. Compliance & Datenschutz

### 5.1 DSGVO-Anforderungen

**Rechtsgrundlage**:
- ✅ Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) für Gesundheitsdaten
- ✅ Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) für App-Bereitstellung

**Betroffenenrechte**:
- ✅ Datenexport → Alle Tabellen mit `user_id` Filter
- ✅ Datenlöschung → CASCADE DELETE implementiert
- ✅ Datenkorrektur → UPDATE-Funktionen vorhanden

### 5.2 Datenminimierung (Pilotphase)

**Pilotphase-spezifisch**:
- ✅ Pseudonyme Namen (reduziert personenbezogene Daten)
- ✅ E-Mail nur für Login (nicht in Logs/Exports)
- ✅ Optionale Felder: `phone`, `address`, `ahv_number` können leer bleiben
- ✅ Nach Pilotphase: Einfache Löschung aller Daten möglich (CASCADE DELETE)

---

## 6. Fazit

### ✅ Abgestimmtheit bestätigt

**Funktionsliste ↔ Datenmodell**:
- ✅ Alle Funktionen haben entsprechende Datenstrukturen
- ✅ Alle Datenfelder werden durch Funktionen genutzt
- ✅ Keine überflüssigen Felder oder fehlende Funktionen
- ✅ Indizes optimiert für häufige Abfragen
- ✅ Beziehungen korrekt implementiert (Foreign Keys)

**Pilotphase-Ready**:
- ✅ Datenmodell unterstützt Pseudonyme Namen (keine DB-Änderung nötig)
- ✅ E-Mail-Handling ohne DB-Änderung anpassbar
- ✅ Admin-Zugriff ohne Datenmodell-Änderung möglich (Hash-basiert)
- ✅ Alle Funktionen für 3-monatige Pilotphase vollständig abgedeckt

---

## 7. Pilotphase-spezifische Anforderungen

### 7.1 Vor Pilotphase-Start (zu implementieren):
1. ✅ **Pseudonyme Namen**: UI-Anpassung in Registrierung
   - Feld "Anzeigename" statt "Name"
   - Hinweis: "Verwenden Sie einen Pseudonym-Namen für die Pilotphase"
   - Keine DB-Änderung nötig

2. ✅ **Admin-Zugriff**: Controller und API-Routen implementieren
   - Admin-Controller für anonymisierte Befinden-Daten
   - Admin-Controller für anonymisierte Seizure-Daten
   - API-Routen: `/api/admin/befinden`, `/api/admin/seizures`
   - Hash-basierte anonyme User-IDs (keine DB-Änderung)

3. ✅ **E-Mail-Logging**: Sicherstellen, dass E-Mails nicht in Logs erscheinen
   - Logging-Middleware anpassen
   - E-Mail-Felder aus Exports entfernen

4. ✅ **Multi-User-Analytics**: Vergleichs-Funktionen für Admin
   - Aggregierte Statistiken über alle Benutzer
   - Vergleichs-Dashboard
   - Keine DB-Änderung nötig (Queries auf bestehenden Tabellen)

### 7.2 Während Pilotphase (3 Monate):
- Monitoring der Datenmodell-Performance
- Feedback zu fehlenden Feldern/Funktionen sammeln
- Admin-Zugriff auf anonymisierte Daten nutzen
- Multi-User-Vergleiche durchführen

### 7.3 Nach Pilotphase:
- ✅ Datenlöschung durchführen (CASCADE DELETE)
- ✅ Alle Testpersonen-Daten entfernen
- ✅ E-Mail-Adressen anonymisieren/löschen

---

**Status**: ✅ Funktionsliste und Datenmodell sind vollständig abgestimmt für die 3-monatige Pilotphase.
