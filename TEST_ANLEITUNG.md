# EpiDoc - Test-Anleitung für Beta-Tester

Willkommen als Beta-Tester der EpiDoc-Anwendung! Diese Anleitung hilft dir dabei, die App systematisch zu testen und wertvolles Feedback zu geben.

---

## 📋 Inhaltsverzeichnis

1. [Vorbereitung](#vorbereitung)
2. [Erste Schritte](#erste-schritte)
3. [Test-Szenarien](#test-szenarien)
4. [Feedback geben](#feedback-geben)
5. [Bekannte Probleme](#bekannte-probleme)
6. [Häufige Fragen](#häufige-fragen)

---

## 🚀 Vorbereitung

### Systemanforderungen

- **Browser**: Chrome, Firefox, Safari oder Edge (neueste Version)
- **Internetverbindung**: Für die erste Anmeldung und Synchronisation
- **Zeit**: Ca. 30-60 Minuten für einen vollständigen Test-Durchlauf

### App starten

1. **Backend starten** (falls noch nicht gestartet):
   ```bash
   cd backend
   php artisan serve
   ```
   Backend läuft auf: `http://localhost:8000`

2. **Frontend starten** (falls noch nicht gestartet):
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend läuft auf: `http://localhost:3000`

3. **Browser öffnen**: Navigiere zu `http://localhost:3000`

---

## 🎯 Erste Schritte

### Test-Account verwenden

Für das Testen stehen folgende Accounts zur Verfügung:

| E-Mail | Passwort | Rolle | Demo-Daten |
|--------|----------|-------|------------|
| `test@example.com` | `Password123` | Patient | ✅ Vorhanden |
| `patient@test.de` | `Password123` | Patient | ✅ Vorhanden |
| `angehoeriger@test.de` | `Password123` | Angehöriger | ❌ Keine |

**Hinweis**: Die Demo-Daten enthalten bereits Beispieleinträge für Befinden, Anfälle und Medikamente.

### Oder: Neuen Account erstellen

1. Klicke auf "Konto erstellen" auf der Login-Seite
2. Fülle das Registrierungsformular aus:
   - **Name**: Dein Name
   - **E-Mail**: Eine gültige E-Mail-Adresse
   - **Passwort**: Mindestens 8 Zeichen, 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl
   - **Rolle**: Wähle "Patient" oder "Angehöriger"
3. Klicke auf "Registrieren"

---

## 🧪 Test-Szenarien

### 1. Authentifizierung

#### 1.1 Login
- [ ] Mit Test-Account einloggen
- [ ] Mit neu erstelltem Account einloggen
- [ ] Falsches Passwort eingeben → Fehlermeldung erscheint
- [ ] Passwort zurücksetzen (siehe "Passwort vergessen")

#### 1.2 Registrierung
- [ ] Neuen Account erstellen
- [ ] Schwaches Passwort eingeben → Validierungsfehler
- [ ] Bereits existierende E-Mail verwenden → Fehlermeldung
- [ ] Alle Felder ausfüllen und erfolgreich registrieren

#### 1.3 Passwort zurücksetzen
- [ ] Auf "Passwort vergessen" klicken
- [ ] E-Mail-Adresse eingeben
- [ ] Reset-Link erhalten (im Dev-Modus wird Link direkt angezeigt)
- [ ] Neues Passwort setzen
- [ ] Mit neuem Passwort einloggen

#### 1.4 Logout
- [ ] Auf Benutzer-Menü klicken
- [ ] "Abmelden" wählen
- [ ] Wird zur Login-Seite weitergeleitet

---

### 2. Befinden-Tracking

#### 2.1 Befinden eintragen
- [ ] Zur "Befinden"-Seite navigieren
- [ ] Neuen Eintrag erstellen:
  - [ ] Datum wählen
  - [ ] Tageszeit wählen (Morgen, Mittag, Abend)
  - [ ] Kategorie wählen (Körperlich, Mental, Lebensstil, Alternative)
  - [ ] Symptom wählen
  - [ ] Bewertung eingeben (0-10)
  - [ ] Optional: Fragen beantworten
- [ ] Eintrag speichern
- [ ] Erfolgsmeldung erscheint

#### 2.2 Befinden anzeigen
- [ ] Befinden-Einträge werden in der Liste angezeigt
- [ ] Datum, Tageszeit, Kategorie und Bewertung sind sichtbar
- [ ] Einträge können nach Datum sortiert werden
- [ ] Filter nach Kategorie funktioniert

#### 2.3 Befinden bearbeiten
- [ ] Eintrag öffnen
- [ ] Daten ändern
- [ ] Speichern
- [ ] Änderungen sind sichtbar

#### 2.4 Befinden löschen
- [ ] Eintrag löschen
- [ ] Bestätigungsdialog erscheint
- [ ] Eintrag wird aus der Liste entfernt

---

### 3. Anfallstagebuch

#### 3.1 Anfall eintragen
- [ ] Zur "Anfallstagebuch"-Seite navigieren
- [ ] Neuen Anfall eintragen:
  - [ ] Datum und Uhrzeit wählen
  - [ ] Anfallstyp wählen (oder eigenen Typ eingeben)
  - [ ] Anzahl der Anfälle eingeben
  - [ ] Dauer eingeben (Minuten/Sekunden)
  - [ ] Optional: Vorwarnzeichen, Symptome, Nachwirkungen, Auslöser
  - [ ] Optional: Notfallmedikament verwendet?
- [ ] Anfall speichern
- [ ] Erfolgsmeldung erscheint

#### 3.2 Anfälle anzeigen
- [ ] Anfall-Einträge werden in der Liste angezeigt
- [ ] Datum, Typ, Anzahl und Dauer sind sichtbar
- [ ] Einträge können nach Datum sortiert werden
- [ ] Filter nach Typ funktioniert

#### 3.3 Anfall bearbeiten
- [ ] Eintrag öffnen
- [ ] Daten ändern
- [ ] Speichern
- [ ] Änderungen sind sichtbar

#### 3.4 Anfall löschen
- [ ] Eintrag löschen
- [ ] Bestätigungsdialog erscheint
- [ ] Eintrag wird aus der Liste entfernt

---

### 4. Medikamente

#### 4.1 Medikament hinzufügen
- [ ] Zur "Medikamente"-Seite navigieren
- [ ] Neues Medikament hinzufügen:
  - [ ] Name eingeben
  - [ ] Dosierung eingeben
  - [ ] Tageszeit wählen
  - [ ] Optional: Kommentar hinzufügen
- [ ] Medikament speichern
- [ ] Erfolgsmeldung erscheint

#### 4.2 Medikamente anzeigen
- [ ] Medikamente werden in der Liste angezeigt
- [ ] Name, Dosierung und Tageszeit sind sichtbar
- [ ] Aktive und archivierte Medikamente werden getrennt angezeigt

#### 4.3 Medikament bearbeiten
- [ ] Medikament öffnen
- [ ] Daten ändern
- [ ] Speichern
- [ ] Änderungen sind sichtbar

#### 4.4 Medikament archivieren
- [ ] Medikament archivieren
- [ ] Grund für Archivierung eingeben (optional)
- [ ] Medikament wird zu "Archivierte Medikamente" verschoben

---

### 5. Verlauf & Analyse

#### 5.1 Verlauf anzeigen
- [ ] Zur "Verlauf"-Seite navigieren
- [ ] Befinden-Verlauf wird als Grafik angezeigt
- [ ] Anfall-Verlauf wird als Grafik angezeigt
- [ ] Zeitraum kann gewählt werden (7 Tage, 30 Tage, 90 Tage, 1 Jahr)
- [ ] Filter nach Kategorie/Symptom funktioniert

#### 5.2 Statistiken
- [ ] Durchschnittliche Befinden-Bewertung wird angezeigt
- [ ] Anzahl der Anfälle im Zeitraum wird angezeigt
- [ ] Trends werden visualisiert

#### 5.3 Daten exportieren
- [ ] Export-Button klicken
- [ ] JSON-Export funktioniert
- [ ] PDF-Export funktioniert (falls implementiert)
- [ ] Exportierte Datei kann heruntergeladen werden

---

### 6. Navigation & UI

#### 6.1 Navigation
- [ ] Navbar ist auf allen geschützten Seiten sichtbar
- [ ] Alle Links funktionieren:
  - [ ] Befinden
  - [ ] Anfallstagebuch
  - [ ] Medikamente
  - [ ] Verlauf
  - [ ] Einstellungen
- [ ] Benutzer-Menü funktioniert
- [ ] Logout funktioniert

#### 6.2 Responsive Design
- [ ] App funktioniert auf Desktop
- [ ] App funktioniert auf Tablet
- [ ] App funktioniert auf Smartphone
- [ ] Navigation ist auf allen Geräten nutzbar

#### 6.3 Fehlerbehandlung
- [ ] Fehlermeldungen sind verständlich
- [ ] Validierungsfehler werden angezeigt
- [ ] 404-Seite wird angezeigt bei nicht existierenden Routen
- [ ] Offline-Modus funktioniert (Daten werden lokal gespeichert)

---

### 7. Einstellungen

#### 7.1 Profil bearbeiten
- [ ] Zur "Einstellungen"-Seite navigieren
- [ ] Name ändern
- [ ] E-Mail ändern
- [ ] Änderungen speichern
- [ ] Erfolgsmeldung erscheint

#### 7.2 Passwort ändern
- [ ] Aktuelles Passwort eingeben
- [ ] Neues Passwort eingeben
- [ ] Neues Passwort bestätigen
- [ ] Passwort ändern
- [ ] Erfolgsmeldung erscheint
- [ ] Mit neuem Passwort einloggen

---

## 📝 Feedback geben

### Was ist wichtig?

1. **Funktionalität**: Funktioniert alles wie erwartet?
2. **Benutzerfreundlichkeit**: Ist die App intuitiv zu bedienen?
3. **Performance**: Lädt die App schnell genug?
4. **Design**: Gefällt dir das Design?
5. **Fehler**: Hast du Fehler gefunden?

### Feedback-Formular

Bitte fülle für jeden gefundenen Fehler oder Verbesserungsvorschlag folgende Informationen aus:

#### Fehler melden

```
**Beschreibung**: [Was ist passiert?]
**Schritte zur Reproduktion**:
1. [Schritt 1]
2. [Schritt 2]
3. [Schritt 3]
**Erwartetes Verhalten**: [Was sollte passieren?]
**Tatsächliches Verhalten**: [Was ist passiert?]
**Screenshot**: [Falls möglich]
**Browser**: [Chrome, Firefox, Safari, etc.]
**Betriebssystem**: [Windows, macOS, Linux, iOS, Android]
```

#### Verbesserungsvorschlag

```
**Feature**: [Welches Feature?]
**Vorschlag**: [Was würdest du ändern/verbessern?]
**Begründung**: [Warum ist das wichtig?]
```

### Feedback senden

- **E-Mail**: [Deine E-Mail-Adresse für Feedback]
- **GitHub Issues**: [Falls GitHub verwendet wird]
- **Feedback-Formular**: [Falls in der App vorhanden]

---

## ⚠️ Bekannte Probleme

### Aktuelle Einschränkungen

1. **Video-Upload**: Noch nicht implementiert (Feld vorhanden, aber nicht funktional)
2. **E-Mail-Versand**: Im Dev-Modus werden Reset-Links direkt angezeigt (nicht per E-Mail)
3. **Offline-Synchronisation**: Daten werden lokal gespeichert, aber Synchronisation bei Verbindungsverlust noch nicht vollständig getestet

### Workarounds

- **Passwort zurücksetzen**: Im Dev-Modus wird der Reset-Link direkt auf der Seite angezeigt
- **Offline-Modus**: Daten werden lokal gespeichert, aber Synchronisation sollte manuell getestet werden

---

## ❓ Häufige Fragen

### Wie kann ich die Demo-Daten zurücksetzen?

```bash
cd backend
php artisan migrate:fresh --seed
```

**Achtung**: Dies löscht alle Daten und erstellt sie neu!

### Wie kann ich einen neuen Test-Account erstellen?

1. Gehe zur Registrierungsseite
2. Fülle das Formular aus
3. Klicke auf "Registrieren"

### Was passiert, wenn ich offline bin?

- Daten werden lokal in deinem Browser gespeichert
- Beim nächsten Online-Sein werden die Daten synchronisiert
- **Hinweis**: Vollständige Offline-Funktionalität ist noch in Entwicklung

### Kann ich meine Daten exportieren?

Ja! Gehe zur "Verlauf"-Seite und klicke auf "Exportieren". Du kannst deine Daten als JSON oder PDF exportieren.

### Wie kann ich mein Passwort zurücksetzen?

1. Klicke auf "Passwort vergessen" auf der Login-Seite
2. Gib deine E-Mail-Adresse ein
3. Im Dev-Modus wird der Reset-Link direkt angezeigt
4. Klicke auf den Link und setze ein neues Passwort

---

## 🎯 Test-Checkliste

### Basis-Funktionalität
- [ ] Login/Registrierung funktioniert
- [ ] Befinden eintragen/anzeigen/bearbeiten/löschen
- [ ] Anfälle eintragen/anzeigen/bearbeiten/löschen
- [ ] Medikamente hinzufügen/anzeigen/bearbeiten/archivieren
- [ ] Verlauf anzeigen
- [ ] Daten exportieren
- [ ] Einstellungen bearbeiten

### Erweiterte Funktionen
- [ ] Passwort zurücksetzen
- [ ] Offline-Modus
- [ ] Responsive Design
- [ ] Fehlerbehandlung
- [ ] Navigation

### Edge Cases
- [ ] Falsche Eingaben
- [ ] Leere Felder
- [ ] Sehr lange Texte
- [ ] Sonderzeichen
- [ ] Netzwerkfehler

---

## 📞 Support

Bei Fragen oder Problemen:

1. **Dokumentation prüfen**: Siehe `TROUBLESHOOTING.md`
2. **Feedback senden**: Siehe "Feedback geben" oben
3. **Kontakt**: [Deine Kontaktinformationen]

---

**Vielen Dank für dein Engagement als Beta-Tester!** 🎉

Dein Feedback hilft uns, EpiDoc zu verbessern und zu einer besseren Anwendung zu machen.

---

**Version**: 1.0  
**Stand**: Januar 2025  
**Letzte Aktualisierung**: Nach Demo-Daten-Implementierung

