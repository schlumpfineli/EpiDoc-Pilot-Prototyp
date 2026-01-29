# EpiDoc - Checkliste für Pilot-Start

**Stand**: Januar 2025  
**Ziel**: Vollständige Vorbereitung für den Start des Pilotprojekts

Diese Checkliste enthält alle Aufgaben, die vor dem Start des Pilotprojekts erledigt werden müssen.

---

## 📋 Inhaltsverzeichnis

1. [Code-Qualität & Technische Vorbereitung](#code-qualität--technische-vorbereitung)
2. [Tests](#tests)
3. [Datenschutz & Rechtliches](#datenschutz--rechtliches)
4. [Deployment-Vorbereitung](#deployment-vorbereitung)
5. [Dokumentation](#dokumentation)
6. [Beta-Testing](#beta-testing)
7. [Monitoring & Support](#monitoring--support)

---

## 🔧 Code-Qualität & Technische Vorbereitung

### Backend

- [ ] **Alle PHP Syntax-Fehler behoben**
  - [ ] PHP Syntax-Check durchgeführt: `php -l` auf alle PHP-Dateien
  - [ ] Keine Parse-Errors vorhanden

- [ ] **Laravel Commands funktionsfähig**
  - [x] `db:backup` - Registriert und funktionsfähig
  - [x] `migrate:safe` - Registriert und funktionsfähig
  - [ ] Alle Commands getestet

- [ ] **API-Routes vollständig**
  - [x] Alle 27 API-Routes korrekt registriert
  - [x] Rate Limiting aktiv
  - [x] CORS konfiguriert
  - [ ] Alle Endpunkte manuell getestet

- [ ] **Fehlende API-Endpunkte implementieren**
  - [ ] `POST /api/password/forgot` - Passwort vergessen
  - [ ] `POST /api/password/reset` - Passwort zurücksetzen
  - [ ] `POST /api/token/refresh` - Token erneuern
  - [ ] `PUT /api/user/password` - Passwort ändern
  - [ ] `PUT /api/user/email-notifications` - E-Mail-Benachrichtigungen
  - [ ] `GET /api/user/export` - Datenexport
  - [ ] `POST /api/user/push/subscribe` - Push abonnieren
  - [ ] `POST /api/user/push/unsubscribe` - Push kündigen

- [ ] **Backup-System**
  - [x] Backup-Command funktioniert
  - [x] Backup-Dateien werden korrekt erstellt
  - [ ] Backup-Wiederherstellung getestet
  - [ ] Automatische Backup-Bereinigung (30 Tage) funktioniert

- [ ] **Sicherheitsmaßnahmen**
  - [x] SQL-Injection-Schutz (Prepared Statements)
  - [x] XSS-Schutz (Input Sanitization)
  - [x] Passwort-Sicherheit (bcrypt, Strong Password Rules)
  - [x] Authentifizierung & Autorisierung (Laravel Sanctum)
  - [x] Rate Limiting
  - [x] Input-Validierung
  - [x] Security Headers
  - [ ] Security Headers in Produktion getestet
  - [ ] Rate Limiting in Produktion getestet

### Frontend

- [ ] **TypeScript-Kompilierung**
  - [x] Keine TypeScript-Fehler
  - [x] Alle Typen korrekt definiert
  - [ ] Production Build ohne Fehler: `npm run build`

- [ ] **Fehlende Features implementieren**
  - [ ] Passwort-Reset-Funktionalität (Frontend)
  - [ ] Token-Refresh-Funktionalität (Frontend)
  - [ ] Datenexport-Funktionalität (Frontend)
  - [ ] Push-Benachrichtigungen (Frontend)
  - [ ] E-Mail-Benachrichtigungen-Einstellungen (Frontend)

- [ ] **UI/UX Verbesserungen**
  - [ ] Alle Seiten responsive getestet (Mobile, Tablet, Desktop)
  - [ ] Fehlerbehandlung auf allen Seiten konsistent
  - [ ] Loading-States auf allen Seiten
  - [ ] Erfolgsmeldungen konsistent
  - [ ] Navigation funktioniert auf allen Seiten

- [ ] **Offline-Funktionalität**
  - [ ] Service Worker registriert
  - [ ] Offline-Speicherung funktioniert
  - [ ] Synchronisation bei Verbindungsverlust getestet
  - [ ] Offline-Indikator vorhanden

---

## 🧪 Tests

### Backend-Tests (PHPUnit)

- [ ] **Alle bestehenden Tests ausführen**
  ```bash
  cd backend
  php artisan test
  ```

- [ ] **Test-Abdeckung prüfen**
  - [x] `AuthControllerTest.php` - Authentifizierung
  - [x] `BefindenControllerTest.php` - Befinden CRUD
  - [x] `SeizureControllerTest.php` - Anfälle CRUD
  - [x] `MedicationControllerTest.php` - Medikamente CRUD
  - [x] `SqlInjectionProtectionTest.php` - Sicherheit
  - [x] `TokenExpirationTest.php` - Token-Verwaltung
  - [x] `MigrationTest.php` - Migrationen
  - [x] `SanitizationHelperTest.php` - Input-Sanitization
  - [ ] Alle Tests bestehen ohne Fehler

- [ ] **Fehlende Tests schreiben**
  - [ ] Passwort-Reset-Tests
  - [ ] Token-Refresh-Tests
  - [ ] Profil-Update-Tests (erweitert)
  - [ ] Datenexport-Tests
  - [ ] Push-Benachrichtigungen-Tests
  - [ ] E-Mail-Benachrichtigungen-Tests
  - [ ] Account-Löschung-Tests (erweitert)
  - [ ] Backup-Wiederherstellung-Tests

- [ ] **Integrationstests**
  - [ ] Vollständiger Registrierungs- und Login-Flow
  - [ ] CRUD-Operationen für alle Entitäten
  - [ ] Datenexport-Flow
  - [ ] Passwort-Reset-Flow

### Frontend-Tests

- [ ] **Unit-Tests (Vitest)**
  - [x] `validations.test.ts` - Validierungen
  - [x] `sanitize.test.ts` - Sanitization
  - [x] `ProtectedRoute.test.tsx` - Route-Schutz
  - [ ] Alle Tests bestehen: `npm test`

- [ ] **E2E-Tests (Playwright)**
  - [x] `auth.spec.ts` - Authentifizierung
  - [x] `befinden.spec.ts` - Befinden
  - [x] `seizure.spec.ts` - Anfälle
  - [x] `navigation.spec.ts` - Navigation
  - [ ] Alle E2E-Tests bestehen: `npm run test:e2e`
  - [ ] Fehlende E2E-Tests schreiben:
    - [ ] Medikamente-E2E-Tests
    - [ ] Profil-E2E-Tests
    - [ ] Passwort-Reset-E2E-Tests
    - [ ] Datenexport-E2E-Tests
    - [ ] Responsive Design E2E-Tests

- [ ] **Manuelle Tests**
  - [ ] Alle Seiten manuell getestet
  - [ ] Alle Formulare getestet
  - [ ] Alle Navigation-Links getestet
  - [ ] Fehlerbehandlung getestet
  - [ ] Browser-Kompatibilität getestet (Chrome, Firefox, Safari, Edge)
  - [ ] Mobile-Responsiveness getestet

### Sicherheits-Tests

- [ ] **SQL-Injection-Tests**
  - [x] SQL-Injection-Schutz getestet
  - [ ] Erweiterte SQL-Injection-Szenarien testen

- [ ] **XSS-Tests**
  - [x] XSS-Schutz getestet
  - [ ] Erweiterte XSS-Szenarien testen

- [ ] **CSRF-Tests**
  - [ ] CSRF-Schutz getestet
  - [ ] API-Endpunkte gegen CSRF geschützt

- [ ] **Authentifizierungs-Tests**
  - [ ] Zugriff auf geschützte Routen ohne Token
  - [ ] Zugriff auf fremde Daten
  - [ ] Token-Ablauf getestet
  - [ ] Token-Refresh getestet

- [ ] **Rate Limiting-Tests**
  - [ ] Rate Limiting funktioniert
  - [ ] Zu viele Requests werden blockiert

---

## 🔒 Datenschutz & Rechtliches

### Datenschutzerklärung & Einwilligungstexte

- [ ] **Datenschutzerklärung implementieren**
  - [ ] Datenschutzerklärung-Seite erstellen (`/datenschutz`)
  - [ ] Text finalisieren (rechtlich geprüft)
  - [ ] Link in Footer/Navigation einbinden

- [ ] **Einwilligungstexte implementieren**
  - [ ] Einwilligung bei Registrierung hinzufügen
  - [ ] Checkbox für Datenschutzerklärung
  - [ ] Checkbox für Gesundheitsdaten-Einwilligung (Art. 9 DSGVO)
  - [ ] Checkbox für E-Mail-Benachrichtigungen (optional)

- [ ] **Impressum**
  - [ ] Impressum-Seite erstellen (`/impressum`)
  - [ ] Alle erforderlichen Informationen enthalten
  - [ ] Link in Footer einbinden

- [ ] **Kontakt für Datenschutz**
  - [ ] Kontakt-Seite oder E-Mail-Adresse für Datenschutzanfragen
  - [ ] In Datenschutzerklärung verlinkt

### DSGVO-Konformität

- [ ] **Betroffenenrechte implementieren**
  - [x] Auskunftsrecht (Datenexport)
  - [x] Löschrecht (Account-Löschung)
  - [x] Widerspruchsrecht (E-Mail-Benachrichtigungen)
  - [ ] Berichtigungsrecht (Profil-Bearbeitung erweitern)
  - [ ] Einschränkung der Verarbeitung (optional)
  - [ ] Datenübertragbarkeit (Export im Standardformat)

- [ ] **Dokumentation**
  - [ ] Verarbeitungsverzeichnis erstellen
  - [ ] Datenschutz-Folgenabschätzung (DSFA) durchführen (falls erforderlich)
  - [ ] Auftragsverarbeitungsvertrag (AVV) mit Hosting-Provider prüfen

- [ ] **Cookie-Banner** (falls Cookies verwendet werden)
  - [ ] Cookie-Banner implementieren
  - [ ] Cookie-Richtlinie erstellen

---

## 🚀 Deployment-Vorbereitung

### Code-Vorbereitung

- [ ] **Code auf GitHub**
  - [ ] Alle Änderungen committed
  - [ ] Code auf GitHub gepusht
  - [ ] `.env` Dateien NICHT committed (in `.gitignore`)
  - [ ] Keine sensiblen Daten im Code

- [ ] **Production-Build testen**
  - [ ] Backend Production-Build: `composer install --optimize-autoloader --no-dev`
  - [ ] Frontend Production-Build: `npm run build`
  - [ ] Build ohne Fehler

### Umgebungsvariablen

- [ ] **Backend `.env.production.example`**
  - [x] Datei vorhanden
  - [ ] Alle erforderlichen Variablen dokumentiert
  - [ ] Beispielwerte korrekt

- [ ] **Frontend `.env.production.example`**
  - [x] Datei vorhanden
  - [ ] Alle erforderlichen Variablen dokumentiert
  - [ ] Beispielwerte korrekt

### Deployment-Konfiguration

- [ ] **Railway (Backend)**
  - [ ] Railway Account erstellt
  - [ ] Projekt erstellt
  - [ ] PostgreSQL-Datenbank erstellt
  - [ ] Umgebungsvariablen vorbereitet
  - [ ] Build-Command konfiguriert
  - [ ] Start-Command konfiguriert

- [ ] **Vercel (Frontend)**
  - [ ] Vercel Account erstellt
  - [ ] Projekt importiert
  - [ ] Root Directory: `frontend`
  - [ ] Umgebungsvariablen vorbereitet
  - [ ] Build-Command konfiguriert

### Pre-Deployment-Checks

- [ ] **Sicherheit**
  - [ ] `APP_DEBUG=false` in Production
  - [ ] `APP_ENV=production` in Production
  - [ ] `ADMIN_PASSWORD` geändert (falls Standard)
  - [ ] Keine Test-Daten in Production
  - [ ] HTTPS aktiv (automatisch bei Railway/Vercel)

- [ ] **Datenbank**
  - [ ] Migrationen getestet
  - [ ] Backup-System funktioniert
  - [ ] Datenbank-Backup vor Deployment

- [ ] **E-Mail**
  - [ ] E-Mail-Provider konfiguriert (SendGrid/Mailgun/Gmail)
  - [ ] E-Mail-Versand getestet
  - [ ] Passwort-Reset-E-Mails funktionieren

---

## 📚 Dokumentation

### Technische Dokumentation

- [x] `PROJEKT_DOKUMENTATION.md` - Vollständige Projekt-Dokumentation
- [x] `DEPLOYMENT_CHECKLISTE.md` - Deployment-Anleitung
- [x] `FINAL_DEPLOYMENT_CHECKLISTE.md` - Finale Deployment-Checkliste
- [x] `TEST_ANLEITUNG.md` - Test-Anleitung für Beta-Tester
- [x] `TROUBLESHOOTING.md` - Troubleshooting-Guide
- [x] `SERVER_START_ANLEITUNG.md` - Server-Start-Anleitung

- [ ] **API-Dokumentation**
  - [ ] Vollständige API-Dokumentation erstellen
  - [ ] Alle Endpunkte dokumentiert
  - [ ] Request/Response-Beispiele
  - [ ] Authentifizierung dokumentiert

- [ ] **Datenmodell-Dokumentation**
  - [x] Datenmodell in `PROJEKT_DOKUMENTATION.md` dokumentiert
  - [ ] ER-Diagramm erstellen (optional)

### Benutzer-Dokumentation

- [ ] **Benutzerhandbuch**
  - [ ] Kurzanleitung für Benutzer
  - [ ] FAQ-Seite
  - [ ] Video-Tutorials (optional)

- [ ] **Beta-Tester-Anleitung**
  - [x] `TEST_ANLEITUNG.md` vorhanden
  - [ ] Feedback-Mechanismus dokumentiert
  - [ ] Bekannte Probleme dokumentiert

---

## 👥 Beta-Testing

### Vorbereitung

- [ ] **Test-Accounts vorbereiten**
  - [x] Demo-Daten vorhanden
  - [ ] Test-Accounts dokumentiert
  - [ ] Passwörter sicher gespeichert

- [ ] **Feedback-System**
  - [x] Feedback-Endpunkt implementiert
  - [x] Admin-Interface für Feedback vorhanden
  - [ ] Feedback-Mechanismus in App sichtbar

- [ ] **Beta-Tester rekrutieren**
  - [ ] Beta-Tester identifiziert
  - [ ] Test-Anleitung versendet
  - [ ] Zeitplan für Beta-Testing festgelegt

### Durchführung

- [ ] **Beta-Testing durchführen**
  - [ ] Beta-Tester einladen
  - [ ] Feedback sammeln
  - [ ] Bugs dokumentieren
  - [ ] Verbesserungsvorschläge sammeln

- [ ] **Bugs beheben**
  - [ ] Kritische Bugs sofort beheben
  - [ ] Wichtige Bugs vor Pilot-Start beheben
  - [ ] Kleinere Bugs dokumentieren für später

---

## 📊 Monitoring & Support

### Monitoring

- [ ] **Error Tracking** (optional)
  - [ ] Sentry oder ähnliches einrichten
  - [ ] Error-Logging konfiguriert

- [ ] **Analytics** (optional)
  - [ ] Google Analytics oder ähnliches einrichten
  - [ ] Datenschutz-konform konfiguriert

- [ ] **Logging**
  - [x] Backend-Logging vorhanden
  - [ ] Log-Rotation konfiguriert
  - [ ] Logs regelmäßig prüfen

### Support

- [ ] **Support-Kanal**
  - [ ] E-Mail-Adresse für Support
  - [ ] Kontaktformular (optional)
  - [ ] Support-Dokumentation

- [ ] **Feedback-Mechanismus**
  - [x] Feedback-System implementiert
  - [ ] Feedback regelmäßig prüfen
  - [ ] Feedback beantworten

---

## ✅ Finale Checkliste vor Pilot-Start

### Technisch

- [ ] Alle Tests bestehen (Backend + Frontend)
- [ ] Production-Build erfolgreich
- [ ] Keine kritischen Bugs bekannt
- [ ] Sicherheitsmaßnahmen aktiv
- [ ] Backup-System funktioniert
- [ ] E-Mail-Versand funktioniert

### Rechtlich

- [ ] Datenschutzerklärung vorhanden
- [ ] Einwilligungstexte implementiert
- [ ] Impressum vorhanden
- [ ] DSGVO-Konformität geprüft

### Deployment

- [ ] Backend deployed (Railway)
- [ ] Frontend deployed (Vercel)
- [ ] CORS korrekt konfiguriert
- [ ] HTTPS aktiv
- [ ] Alle Funktionen in Production getestet

### Dokumentation

- [ ] Alle Dokumentationen aktualisiert
- [ ] Beta-Tester-Anleitung versendet
- [ ] Support-Kanal eingerichtet

### Beta-Testing

- [ ] Beta-Testing abgeschlossen
- [ ] Kritische Bugs behoben
- [ ] Feedback ausgewertet

---

## 🎯 Prioritäten

### 🔴 Kritisch (MUSS vor Pilot-Start erledigt werden)

1. Alle fehlenden API-Endpunkte implementieren
2. Alle Tests bestehen lassen
3. Datenschutzerklärung und Einwilligungstexte implementieren
4. Production-Build testen
5. Deployment durchführen
6. Alle kritischen Bugs beheben

### 🟡 Wichtig (SOLLTE vor Pilot-Start erledigt werden)

1. Fehlende Tests schreiben
2. UI/UX Verbesserungen
3. Impressum erstellen
4. API-Dokumentation erstellen
5. Beta-Testing durchführen

### 🟢 Optional (KANN nach Pilot-Start erledigt werden)

1. Erweiterte DSGVO-Funktionen
2. Cookie-Banner (falls benötigt)
3. Erweiterte Monitoring-Tools
4. Video-Tutorials
5. ER-Diagramm

---

## 📅 Geschätzter Zeitaufwand

- **Code-Qualität & Technische Vorbereitung**: 2-3 Tage
- **Tests**: 2-3 Tage
- **Datenschutz & Rechtliches**: 1-2 Tage
- **Deployment-Vorbereitung**: 1 Tag
- **Dokumentation**: 1 Tag
- **Beta-Testing**: 1-2 Wochen (parallel zu anderen Aufgaben)
- **Monitoring & Support**: 1 Tag

**Gesamt**: ~1-2 Wochen (ohne Beta-Testing)

---

## 📝 Notizen

_Hier können Sie Notizen während der Vorbereitung machen:_

- 
- 
- 

---

**Stand**: Januar 2025  
**Nächste Überprüfung**: Vor Pilot-Start

