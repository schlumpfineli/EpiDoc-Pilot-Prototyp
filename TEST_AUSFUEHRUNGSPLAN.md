# EpiDoc - Test-Ausführungsplan für Pilot-Start

**Stand**: Januar 2025  
**Ziel**: Vollständige Test-Abdeckung vor Pilot-Start

Diese Liste enthält alle Tests, die noch ausgeführt werden müssen.

---

## 📋 Inhaltsverzeichnis

1. [Backend-Tests (PHPUnit)](#backend-tests-phpunit)
2. [Frontend-Tests (Vitest)](#frontend-tests-vitest)
3. [E2E-Tests (Playwright)](#e2e-tests-playwright)
4. [Manuelle Tests](#manuelle-tests)
5. [Sicherheits-Tests](#sicherheits-tests)
6. [Performance-Tests](#performance-tests)
7. [Browser-Kompatibilitäts-Tests](#browser-kompatibilitäts-tests)

---

## 🔧 Backend-Tests (PHPUnit)

### Bestehende Tests ausführen

```bash
cd backend
php artisan test
```

**Status**: ⏳ Noch auszuführen

**Erwartete Ergebnisse**:
- [ ] Alle Tests bestehen ohne Fehler
- [ ] Keine Warnings
- [ ] Test-Abdeckung dokumentiert

**Bestehende Test-Dateien**:
- [x] `tests/Feature/AuthControllerTest.php` - Authentifizierung
- [x] `tests/Feature/BefindenControllerTest.php` - Befinden CRUD
- [x] `tests/Feature/SeizureControllerTest.php` - Anfälle CRUD
- [x] `tests/Feature/MedicationControllerTest.php` - Medikamente CRUD
- [x] `tests/Feature/SqlInjectionProtectionTest.php` - SQL-Injection-Schutz
- [x] `tests/Feature/TokenExpirationTest.php` - Token-Ablauf
- [x] `tests/Feature/MigrationTest.php` - Migrationen
- [x] `tests/Unit/SanitizationHelperTest.php` - Input-Sanitization
- [x] `tests/Unit/ExampleTest.php` - Beispiel-Test

### Fehlende Tests schreiben

#### 1. Passwort-Reset-Tests
- [ ] **Test**: Passwort-Reset-Link anfordern
  - [ ] Gültige E-Mail-Adresse
  - [ ] Ungültige E-Mail-Adresse
  - [ ] Nicht existierende E-Mail-Adresse
  - [ ] Rate Limiting bei zu vielen Anfragen

- [ ] **Test**: Passwort zurücksetzen
  - [ ] Gültiger Reset-Token
  - [ ] Abgelaufener Reset-Token
  - [ ] Ungültiger Reset-Token
  - [ ] Schwaches Passwort (Validierung)
  - [ ] Starkes Passwort (erfolgreich)

**Datei**: `tests/Feature/PasswordResetTest.php` (neu erstellen)

#### 2. Token-Refresh-Tests
- [ ] **Test**: Token erneuern
  - [ ] Gültiger Token wird erneuert
  - [ ] Abgelaufener Token (innerhalb Gnadenfrist)
  - [ ] Abgelaufener Token (außerhalb Gnadenfrist)
  - [ ] Ungültiger Token

**Datei**: `tests/Feature/TokenRefreshTest.php` (neu erstellen)

#### 3. Profil-Update-Tests (erweitert)
- [ ] **Test**: Profil vollständig aktualisieren
  - [ ] Alle Felder aktualisieren
  - [ ] Teilweise Aktualisierung
  - [ ] JSON-Felder (doctors, clinics, pharmacies)
  - [ ] Validierung aller Felder

- [ ] **Test**: E-Mail-Benachrichtigungen verwalten
  - [ ] E-Mail-Benachrichtigungen aktivieren
  - [ ] E-Mail-Benachrichtigungen deaktivieren
  - [ ] Teilweise Aktivierung

**Datei**: `tests/Feature/ProfileUpdateTest.php` (erweitern)

#### 4. Datenexport-Tests
- [ ] **Test**: Datenexport
  - [ ] Export mit allen Daten
  - [ ] Export mit leeren Daten
  - [ ] JSON-Format korrekt
  - [ ] Alle Entitäten enthalten (Befinden, Anfälle, Medikamente)

**Datei**: `tests/Feature/DataExportTest.php` (neu erstellen)

#### 5. Push-Benachrichtigungen-Tests
- [ ] **Test**: Push abonnieren
  - [ ] Gültige Subscription
  - [ ] Ungültige Subscription
  - [ ] Duplikat-Subscription

- [ ] **Test**: Push kündigen
  - [ ] Existierende Subscription
  - [ ] Nicht existierende Subscription

**Datei**: `tests/Feature/PushNotificationTest.php` (neu erstellen)

#### 6. Account-Löschung-Tests (erweitert)
- [ ] **Test**: Account löschen
  - [ ] Account mit Daten löschen
  - [ ] Cascade Delete funktioniert (Befinden, Anfälle, Medikamente)
  - [ ] Token wird ungültig nach Löschung
  - [ ] Backup vor Löschung (optional)

**Datei**: `tests/Feature/AccountDeletionTest.php` (erweitern)

#### 7. Backup-Wiederherstellung-Tests
- [ ] **Test**: Backup erstellen
  - [ ] Backup wird erstellt
  - [ ] Backup enthält alle Daten
  - [ ] Backup-Dateiname korrekt

- [ ] **Test**: Backup wiederherstellen
  - [ ] Backup erfolgreich wiederhergestellt
  - [ ] Daten nach Wiederherstellung korrekt

**Datei**: `tests/Feature/BackupRestoreTest.php` (neu erstellen)

#### 8. Integrationstests
- [ ] **Test**: Vollständiger Registrierungs- und Login-Flow
  - [ ] Registrierung → Login → Dashboard
  - [ ] Token wird gespeichert
  - [ ] Geschützte Routen funktionieren

- [ ] **Test**: Vollständiger CRUD-Flow für alle Entitäten
  - [ ] Befinden: Create → Read → Update → Delete
  - [ ] Anfälle: Create → Read → Update → Delete
  - [ ] Medikamente: Create → Read → Update → Archive → Restore → Delete

- [ ] **Test**: Datenexport-Flow
  - [ ] Daten erstellen → Export → Daten prüfen

- [ ] **Test**: Passwort-Reset-Flow
  - [ ] Reset-Link anfordern → Link öffnen → Passwort zurücksetzen → Login

**Datei**: `tests/Feature/IntegrationTest.php` (neu erstellen)

---

## ⚛️ Frontend-Tests (Vitest)

### Bestehende Tests ausführen

```bash
cd frontend
npm test
```

**Status**: ⏳ Noch auszuführen

**Erwartete Ergebnisse**:
- [ ] Alle Tests bestehen ohne Fehler
- [ ] Keine Warnings
- [ ] Test-Abdeckung dokumentiert

**Bestehende Test-Dateien**:
- [x] `lib/validations.test.ts` - Validierungen
- [x] `lib/sanitize.test.ts` - Sanitization
- [x] `components/auth/ProtectedRoute.test.tsx` - Route-Schutz

### Fehlende Tests schreiben

#### 1. API-Client-Tests
- [ ] **Test**: API-Client-Funktionen
  - [ ] GET-Requests
  - [ ] POST-Requests
  - [ ] PUT-Requests
  - [ ] DELETE-Requests
  - [ ] Error-Handling
  - [ ] Token-Verwaltung

**Datei**: `lib/api.test.ts` (neu erstellen)

#### 2. Hook-Tests
- [ ] **Test**: useAuth Hook
  - [ ] Login-Funktion
  - [ ] Logout-Funktion
  - [ ] Token-Verwaltung
  - [ ] User-State

**Datei**: `lib/hooks/useAuth.test.ts` (neu erstellen)

#### 3. Komponenten-Tests
- [ ] **Test**: UI-Komponenten
  - [ ] Button-Komponente
  - [ ] Input-Komponente
  - [ ] Select-Komponente
  - [ ] Form-Komponenten

**Datei**: `components/ui/*.test.tsx` (erweitern)

#### 4. Validierungs-Tests (erweitert)
- [ ] **Test**: Alle Validierungs-Schemas
  - [ ] Registrierung-Validierung
  - [ ] Login-Validierung
  - [ ] Befinden-Validierung
  - [ ] Anfall-Validierung
  - [ ] Medikament-Validierung
  - [ ] Profil-Validierung

**Datei**: `lib/validations.test.ts` (erweitern)

---

## 🎭 E2E-Tests (Playwright)

### Bestehende Tests ausführen

```bash
cd frontend
npm run test:e2e
```

**Status**: ⏳ Noch auszuführen

**Erwartete Ergebnisse**:
- [ ] Alle Tests bestehen ohne Fehler
- [ ] Screenshots bei Fehlern
- [ ] Video-Aufnahmen bei Fehlern

**Bestehende Test-Dateien**:
- [x] `e2e/auth.spec.ts` - Authentifizierung
- [x] `e2e/befinden.spec.ts` - Befinden
- [x] `e2e/seizure.spec.ts` - Anfälle
- [x] `e2e/navigation.spec.ts` - Navigation

### Fehlende Tests schreiben

#### 1. Medikamente-E2E-Tests
- [ ] **Test**: Medikament hinzufügen
  - [ ] Formular öffnen
  - [ ] Alle Felder ausfüllen
  - [ ] Speichern
  - [ ] Erfolgsmeldung

- [ ] **Test**: Medikament bearbeiten
  - [ ] Medikament öffnen
  - [ ] Daten ändern
  - [ ] Speichern
  - [ ] Änderungen sichtbar

- [ ] **Test**: Medikament archivieren
  - [ ] Medikament archivieren
  - [ ] Grund eingeben
  - [ ] In archivierten Medikamenten sichtbar

- [ ] **Test**: Medikament wiederherstellen
  - [ ] Archiviertes Medikament wiederherstellen
  - [ ] In aktiven Medikamenten sichtbar

- [ ] **Test**: Medikament löschen
  - [ ] Medikament löschen
  - [ ] Bestätigungsdialog
  - [ ] Aus Liste entfernt

**Datei**: `e2e/medications.spec.ts` (neu erstellen)

#### 2. Profil-E2E-Tests
- [ ] **Test**: Profil anzeigen
  - [ ] Profil-Seite öffnen
  - [ ] Alle Daten angezeigt

- [ ] **Test**: Profil bearbeiten
  - [ ] Profil-Daten ändern
  - [ ] Speichern
  - [ ] Änderungen sichtbar

- [ ] **Test**: Passwort ändern
  - [ ] Passwort-Formular öffnen
  - [ ] Altes und neues Passwort eingeben
  - [ ] Passwort ändern
  - [ ] Mit neuem Passwort einloggen

- [ ] **Test**: Account löschen
  - [ ] Account-Löschung starten
  - [ ] Bestätigungsdialog
  - [ ] Account gelöscht
  - [ ] Zur Login-Seite weitergeleitet

**Datei**: `e2e/profile.spec.ts` (neu erstellen)

#### 3. Passwort-Reset-E2E-Tests
- [ ] **Test**: Passwort vergessen
  - [ ] "Passwort vergessen" klicken
  - [ ] E-Mail-Adresse eingeben
  - [ ] Reset-Link anfordern
  - [ ] Erfolgsmeldung

- [ ] **Test**: Passwort zurücksetzen
  - [ ] Reset-Link öffnen
  - [ ] Neues Passwort eingeben
  - [ ] Passwort zurücksetzen
  - [ ] Mit neuem Passwort einloggen

**Datei**: `e2e/password-reset.spec.ts` (neu erstellen)

#### 4. Datenexport-E2E-Tests
- [ ] **Test**: Daten exportieren
  - [ ] Export-Button klicken
  - [ ] JSON-Datei wird heruntergeladen
  - [ ] Datei enthält alle Daten

**Datei**: `e2e/data-export.spec.ts` (neu erstellen)

#### 5. Responsive Design E2E-Tests
- [ ] **Test**: Mobile-Ansicht
  - [ ] Navigation funktioniert
  - [ ] Formulare funktionieren
  - [ ] Alle Seiten laden

- [ ] **Test**: Tablet-Ansicht
  - [ ] Navigation funktioniert
  - [ ] Formulare funktionieren
  - [ ] Alle Seiten laden

- [ ] **Test**: Desktop-Ansicht
  - [ ] Navigation funktioniert
  - [ ] Formulare funktionieren
  - [ ] Alle Seiten laden

**Datei**: `e2e/responsive.spec.ts` (neu erstellen)

#### 6. Offline-Funktionalität E2E-Tests
- [ ] **Test**: Offline-Modus
  - [ ] App offline schalten
  - [ ] Daten erstellen (wird lokal gespeichert)
  - [ ] App online schalten
  - [ ] Daten werden synchronisiert

**Datei**: `e2e/offline.spec.ts` (neu erstellen)

---

## 👤 Manuelle Tests

### Authentifizierung

- [ ] **Registrierung**
  - [ ] Mit gültigen Daten
  - [ ] Mit ungültigen Daten (schwaches Passwort)
  - [ ] Mit existierender E-Mail
  - [ ] Alle Validierungsfehler angezeigt

- [ ] **Login**
  - [ ] Mit gültigen Credentials
  - [ ] Mit ungültigen Credentials
  - [ ] Fehlermeldung korrekt

- [ ] **Passwort zurücksetzen**
  - [ ] Reset-Link anfordern
  - [ ] Reset-Link öffnen
  - [ ] Neues Passwort setzen
  - [ ] Mit neuem Passwort einloggen

- [ ] **Logout**
  - [ ] Logout-Funktion
  - [ ] Zur Login-Seite weitergeleitet
  - [ ] Token wird gelöscht

### Befinden

- [ ] **Befinden eintragen**
  - [ ] Alle Felder ausfüllen
  - [ ] Speichern
  - [ ] Erfolgsmeldung
  - [ ] In Liste sichtbar

- [ ] **Befinden bearbeiten**
  - [ ] Eintrag öffnen
  - [ ] Daten ändern
  - [ ] Speichern
  - [ ] Änderungen sichtbar

- [ ] **Befinden löschen**
  - [ ] Eintrag löschen
  - [ ] Bestätigungsdialog
  - [ ] Aus Liste entfernt

- [ ] **Befinden filtern**
  - [ ] Nach Datum filtern
  - [ ] Nach Kategorie filtern
  - [ ] Filter funktioniert

### Anfälle

- [ ] **Anfall eintragen**
  - [ ] Alle Felder ausfüllen
  - [ ] Speichern
  - [ ] Erfolgsmeldung
  - [ ] In Liste sichtbar

- [ ] **Anfall bearbeiten**
  - [ ] Eintrag öffnen
  - [ ] Daten ändern
  - [ ] Speichern
  - [ ] Änderungen sichtbar

- [ ] **Anfall löschen**
  - [ ] Eintrag löschen
  - [ ] Bestätigungsdialog
  - [ ] Aus Liste entfernt

- [ ] **Anfall filtern**
  - [ ] Nach Datum filtern
  - [ ] Filter funktioniert

### Medikamente

- [ ] **Medikament hinzufügen**
  - [ ] Alle Felder ausfüllen
  - [ ] Speichern
  - [ ] Erfolgsmeldung
  - [ ] In Liste sichtbar

- [ ] **Medikament bearbeiten**
  - [ ] Medikament öffnen
  - [ ] Daten ändern
  - [ ] Speichern
  - [ ] Änderungen sichtbar

- [ ] **Medikament archivieren**
  - [ ] Medikament archivieren
  - [ ] Grund eingeben
  - [ ] In archivierten Medikamenten sichtbar

- [ ] **Medikament wiederherstellen**
  - [ ] Archiviertes Medikament wiederherstellen
  - [ ] In aktiven Medikamenten sichtbar

- [ ] **Medikament löschen**
  - [ ] Medikament löschen
  - [ ] Bestätigungsdialog
  - [ ] Aus Liste entfernt

### Profil

- [ ] **Profil anzeigen**
  - [ ] Profil-Seite öffnen
  - [ ] Alle Daten angezeigt

- [ ] **Profil bearbeiten**
  - [ ] Profil-Daten ändern
  - [ ] Speichern
  - [ ] Änderungen sichtbar

- [ ] **Passwort ändern**
  - [ ] Passwort-Formular öffnen
  - [ ] Altes und neues Passwort eingeben
  - [ ] Passwort ändern
  - [ ] Mit neuem Passwort einloggen

- [ ] **Account löschen**
  - [ ] Account-Löschung starten
  - [ ] Bestätigungsdialog
  - [ ] Account gelöscht
  - [ ] Zur Login-Seite weitergeleitet

### Navigation

- [ ] **Alle Navigation-Links**
  - [ ] Befinden
  - [ ] Tagebuch
  - [ ] Medikamente
  - [ ] Analyse
  - [ ] Profil
  - [ ] Logout

- [ ] **Mobile Navigation**
  - [ ] Hamburger-Menü funktioniert
  - [ ] Alle Links funktionieren
  - [ ] Menü schließt nach Klick

### Fehlerbehandlung

- [ ] **API-Fehler**
  - [ ] 400 Bad Request
  - [ ] 401 Unauthorized
  - [ ] 403 Forbidden
  - [ ] 404 Not Found
  - [ ] 422 Validation Error
  - [ ] 500 Internal Server Error
  - [ ] Fehlermeldungen verständlich

- [ ] **Netzwerk-Fehler**
  - [ ] Keine Internetverbindung
  - [ ] Timeout
  - [ ] Fehlermeldungen angezeigt

- [ ] **Validierungsfehler**
  - [ ] Alle Validierungsfehler angezeigt
  - [ ] Fehlermeldungen verständlich
  - [ ] Felder markiert

---

## 🔒 Sicherheits-Tests

### SQL-Injection-Tests

- [ ] **Test**: SQL-Injection-Versuche
  - [ ] In Eingabefeldern
  - [ ] In URL-Parametern
  - [ ] In JSON-Body
  - [ ] Alle Versuche werden blockiert

**Beispiele**:
```sql
' OR '1'='1
'; DROP TABLE users; --
1' UNION SELECT * FROM users--
```

### XSS-Tests

- [ ] **Test**: XSS-Versuche
  - [ ] In Eingabefeldern
  - [ ] In URL-Parametern
  - [ ] In JSON-Body
  - [ ] Alle Versuche werden blockiert/sanitized

**Beispiele**:
```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
javascript:alert('XSS')
```

### CSRF-Tests

- [ ] **Test**: CSRF-Schutz
  - [ ] POST-Requests ohne Token werden blockiert
  - [ ] PUT-Requests ohne Token werden blockiert
  - [ ] DELETE-Requests ohne Token werden blockiert

### Authentifizierungs-Tests

- [ ] **Test**: Zugriff ohne Token
  - [ ] Alle geschützten Routen
  - [ ] 401 Unauthorized zurückgegeben

- [ ] **Test**: Zugriff mit ungültigem Token
  - [ ] Alle geschützten Routen
  - [ ] 401 Unauthorized zurückgegeben

- [ ] **Test**: Zugriff auf fremde Daten
  - [ ] Befinden eines anderen Benutzers
  - [ ] Anfall eines anderen Benutzers
  - [ ] Medikament eines anderen Benutzers
  - [ ] 403 Forbidden oder 404 Not Found zurückgegeben

- [ ] **Test**: Token-Ablauf
  - [ ] Abgelaufener Token
  - [ ] 401 Unauthorized zurückgegeben
  - [ ] Automatischer Logout

### Rate Limiting-Tests

- [ ] **Test**: Rate Limiting
  - [ ] Zu viele Login-Versuche (5/Minute)
  - [ ] Zu viele API-Requests (60/Minute)
  - [ ] Zu viele Token-Refresh-Requests (10/Minute)
  - [ ] 429 Too Many Requests zurückgegeben

---

## ⚡ Performance-Tests

### Backend-Performance

- [ ] **Test**: API-Response-Zeiten
  - [ ] Alle Endpunkte < 500ms
  - [ ] Datenbank-Abfragen optimiert
  - [ ] Indizes vorhanden

- [ ] **Test**: Datenbank-Performance
  - [ ] Große Datenmengen (1000+ Einträge)
  - [ ] Abfragen schnell
  - [ ] Indizes verwendet

### Frontend-Performance

- [ ] **Test**: Ladezeiten
  - [ ] Initial Load < 3 Sekunden
  - [ ] Seitenwechsel < 1 Sekunde
  - [ ] Bilder optimiert

- [ ] **Test**: Bundle-Größe
  - [ ] Production Build < 1MB
  - [ ] Code-Splitting funktioniert
  - [ ] Lazy Loading implementiert

---

## 🌐 Browser-Kompatibilitäts-Tests

### Desktop-Browser

- [ ] **Chrome** (neueste Version)
  - [ ] Alle Funktionen funktionieren
  - [ ] Keine Console-Fehler
  - [ ] Responsive Design korrekt

- [ ] **Firefox** (neueste Version)
  - [ ] Alle Funktionen funktionieren
  - [ ] Keine Console-Fehler
  - [ ] Responsive Design korrekt

- [ ] **Safari** (neueste Version)
  - [ ] Alle Funktionen funktionieren
  - [ ] Keine Console-Fehler
  - [ ] Responsive Design korrekt

- [ ] **Edge** (neueste Version)
  - [ ] Alle Funktionen funktionieren
  - [ ] Keine Console-Fehler
  - [ ] Responsive Design korrekt

### Mobile-Browser

- [ ] **Chrome Mobile** (Android)
  - [ ] Alle Funktionen funktionieren
  - [ ] Touch-Gesten funktionieren
  - [ ] Responsive Design korrekt

- [ ] **Safari Mobile** (iOS)
  - [ ] Alle Funktionen funktionieren
  - [ ] Touch-Gesten funktionieren
  - [ ] Responsive Design korrekt

### Responsive Design

- [ ] **Mobile** (320px - 768px)
  - [ ] Navigation funktioniert
  - [ ] Formulare funktionieren
  - [ ] Alle Seiten laden

- [ ] **Tablet** (768px - 1024px)
  - [ ] Navigation funktioniert
  - [ ] Formulare funktionieren
  - [ ] Alle Seiten laden

- [ ] **Desktop** (1024px+)
  - [ ] Navigation funktioniert
  - [ ] Formulare funktionieren
  - [ ] Alle Seiten laden

---

## 📊 Test-Status-Tracking

### Test-Ausführung

**Datum**: _______________

**Backend-Tests**:
- [ ] Alle Tests ausgeführt
- [ ] Ergebnisse dokumentiert
- [ ] Fehler behoben

**Frontend-Tests**:
- [ ] Alle Tests ausgeführt
- [ ] Ergebnisse dokumentiert
- [ ] Fehler behoben

**E2E-Tests**:
- [ ] Alle Tests ausgeführt
- [ ] Ergebnisse dokumentiert
- [ ] Fehler behoben

**Manuelle Tests**:
- [ ] Alle Tests ausgeführt
- [ ] Ergebnisse dokumentiert
- [ ] Fehler behoben

**Sicherheits-Tests**:
- [ ] Alle Tests ausgeführt
- [ ] Ergebnisse dokumentiert
- [ ] Fehler behoben

**Performance-Tests**:
- [ ] Alle Tests ausgeführt
- [ ] Ergebnisse dokumentiert
- [ ] Optimierungen durchgeführt

**Browser-Kompatibilitäts-Tests**:
- [ ] Alle Tests ausgeführt
- [ ] Ergebnisse dokumentiert
- [ ] Fehler behoben

### Test-Ergebnisse

**Gesamt-Tests**: _______________
**Bestanden**: _______________
**Fehlgeschlagen**: _______________
**Übersprungen**: _______________

**Kritische Fehler**: _______________
**Wichtige Fehler**: _______________
**Kleinere Fehler**: _______________

---

## ✅ Finale Test-Checkliste

Vor Pilot-Start müssen alle folgenden Tests bestanden werden:

- [ ] Alle Backend-Tests bestehen
- [ ] Alle Frontend-Tests bestehen
- [ ] Alle E2E-Tests bestehen
- [ ] Alle manuellen Tests durchgeführt
- [ ] Alle Sicherheits-Tests bestanden
- [ ] Performance-Tests durchgeführt
- [ ] Browser-Kompatibilität getestet
- [ ] Keine kritischen Fehler vorhanden

---

**Stand**: Januar 2025  
**Nächste Überprüfung**: Vor Pilot-Start





