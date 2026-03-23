# EpiDoc – 1-Tages Go-Live-Checkliste (Pilot)

**Ziel:** Am selben Tag sicher deployen, kritische Pfade testen, Testpersonen per Link einladen und bei Problemen schnell reagieren.

**Voraussetzung:** Code ist auf dem Branch/Tag, den ihr deployen wollt (z. B. `main`).

---

## Teil A – Vormittag: Vorbereitung (ca. 1–2 Std.)

### A1. Rollen klären

- [ ] **Technische Verantwortung:** Ich (deployed / ändert Umgebungsvariablen)
- [ ] **Support:** Ich (beantworten von Fragen der Testpersonen (E-Mail/Telefon))?
- [ ] **Datenschutz:** Ich (Ansprechpartner bei Rückfragen zu Daten?)

### A2. URLs notieren (ausfüllen nach Deployment)

| Was | URL |
|-----|-----|
| Frontend (Pilot) | `https://epi-doc-pilot-prototyp.vercel.app` |
| Backend (API) | `https://epidoc-pilot-prototyp-production.up.railway.app` |
| Registrierung (Link für Tester) | `https://epi-doc-pilot-prototyp.vercel.app/register` |
| Login | `https://epi-doc-pilot-prototyp.vercel.app/login` |
| Admin Analytics | `https://epidoc-pilot-prototyp-production.up.railway.app/admin/analytics` |
| Feedback-Übersicht | `https://epidoc-pilot-prototyp-production.up.railway.app/feedback` |

> **Offen:** Admin-Login wird spaeter separat bearbeitet.

### A3. Sicherheit kurz prüfen (Backend-Umgebung)

- [ ] `APP_ENV=production`, `APP_DEBUG=false`
- [ ] `APP_KEY` gesetzt (nicht leer)
- [ ] `ADMIN_PASSWORD` auf ein **starkes, eigenes** Passwort gesetzt (nicht Standard `admin123`)
- [ ] Datenbank: Migrationen auf Production ausgeführt (`php artisan migrate --force`)
- [ ] CORS: `CORS_ALLOWED_ORIGINS` / `FRONTEND_URL` = exakte Frontend-URL (mit `https://`)
- [ ] Frontend: `NEXT_PUBLIC_API_URL` = `https://<backend>/api` (mit `/api` am Ende)

### A4. E-Mail (falls Passwort-Reset im Pilot genutzt wird)

- [ ] SMTP/Provider in Railway konfiguriert
- [ ] Test: „Passwort vergessen“ mit einer echten E-Mail durchspielen

> **Hinweis:** Ohne funktionierendes E-Mail können Tester bei vergessenem Passwort nicht selbst zurücksetzen – dann Support-Kanal bereithalten (siehe Teil D).

---

## Teil B – Mittag: Deployment & Smoke-Tests (ca. 1–2 Std.)

Folgt inhaltlich eurer Anleitung `RAILWAY_VERCEL_DEPLOYMENT.md`. Hier die **minimalen Smoke-Tests** direkt nach Go-Live.

### B1. Öffentliche Seiten

- [ ] Frontend lädt ohne Fehler (Startseite oder Login)
- [ ] Keine sichtbaren Stack-Traces / Laravel-Fehlerseiten

### B2. Registrierung (Pilot-Kern)

- [ ] `…/register` öffnen
- [ ] Neuen Test-Account mit **eigener** Test-E-Mail anlegen (Rolle Patient oder Angehöriger)
- [ ] Nach Registrierung: Weiterleitung funktioniert (z. B. ins Tagebuch/Diary)
- [ ] Abmelden → erneut **Login** mit denselben Zugangsdaten

### B3. Geschützte Bereiche (eingeloggt)

- [ ] Mindestens **einen** Befinden-Eintrag speichern
- [ ] Mindestens **einen** Anfall-Eintrag speichern (falls im Pilot genutzt)
- [ ] Seitenwechsel (Navigation) ohne harte Fehler

### B4. API-Verbindung (bei Problemen zuerst hier schauen)

- [ ] Browser-Konsole: keine durchgehenden CORS-Fehler
- [ ] Bei 401 nach Login: Token/Session prüfen, ggf. `SANCTUM_STATEFUL_DOMAINS` / Cookie-Einstellungen

### B5. Admin (nur Team, nicht an Tester weitergeben)

- [ ] `…/admin/analytics` mit Admin-Passwort erreichbar
- [ ] Optional: `…/feedback` – Feedback-Liste lädt

---

## Teil C – Nachmittag: Testpersonen einladen (ca. 30–60 Min.)

### C1. Einen klaren Pilot-Link verschicken

**Empfohlener Textbaustein (anpassen):**

> Liebe Testperson,  
> bitte öffnet die App unter: **`<Frontend-URL>/register`**  
> Legt dort ein Konto mit eurer E-Mail und einem sicheren Passwort an.  
> Bei Fragen oder technischen Problemen: **`<Support-E-Mail oder Telefon>`**  
> Vielen Dank!

- [ ] Link ist **HTTPS**
- [ ] Link zeigt auf **`/register`** (oder Startseite mit gut sichtbarem „Konto erstellen“)
- [ ] Kurze Anleitung: Browser (Chrome/Safari aktuell), stabile Internetverbindung

### C2. Erwartungen setzen

- [ ] Pilot = kann Bugs haben; Feedback ist erwünscht
- [ ] Keine medizinische Beratung durch die App
- [ ] Support-Zeiten nennen (z. B. 9–17 Uhr)

### C3. Sammeln von Rückmeldungen

- [ ] Ein Kanal festlegen: E-Mail, Formular, oder strukturierte Vorlage aus `TEST_ANLEITUNG.md`

---

## Teil D – Fallback & Eskalation (wenn etwas schiefgeht)

### D1. Symptom → erste Maßnahme

| Symptom | Erste Schritte |
|--------|----------------|
| „Seite lädt nicht“ | Frontend-URL prüfen; Vercel-Deployment-Status; ggf. Redeploy |
| „Registrierung geht nicht“ / API-Fehler | Backend-Logs (Railway); `NEXT_PUBLIC_API_URL` prüfen; CORS |
| „Login geht nach Registrierung nicht“ | Gleiche E-Mail? Passwort korrekt? Rate-Limit (zu viele Versuche?) |
| CORS-Fehler in der Konsole | `CORS_ALLOWED_ORIGINS` exakt auf Frontend-URL; Backend neu starten |
| 401 / Session | Sanctum-Domains; HTTPS; Subdomain-Wechsel vermeiden |

### D2. Schnell-Rollback (wenn nötig)

- [ ] **Vercel:** vorheriges funktionierendes Deployment „Promote to Production“ / Rollback
- [ ] **Railway:** vorheriges Release oder letzter bekannter guter Commit redeployen
- [ ] Nach Rollback: Smoke-Tests B1–B3 erneut

### D3. Kommunikation an Tester

Kurze Vorlage:

> Es gab ein technisches Problem. Bitte die Seite neu laden oder den Link erneut verwenden: `<URL>`. Wir arbeiten an einer Lösung und melden uns bei Bedarf.

---

## Teil E – Tagesabschluss (15–30 Min.)

- [ ] Anzahl neue Registrierungen grob notiert (Admin Analytics oder DB-Export – je nach eurem Vorgehen)
- [ ] Offene Fehlerliste (kurz): kritisch vs. später
- [ ] Backup-Status: wurde heute ein Backup ausgelöst bzw. ist der DB-Dump-Plan klar? (`PILOT_START_CHECKLISTE.md` / Backend-Backup-Command)

---

## Optional: Nächster Tag

- [ ] DSGVO-Texte/Einwilligungen nachziehen, falls noch nicht live
- [ ] Monitoring (Logs täglich kurz ansehen)
- [ ] Entscheidung: Offene Registrierung beibehalten oder später **Invite-Code / Whitelist** einführen

---

**Stand:** März 2026  
**Bezug:** `RAILWAY_VERCEL_DEPLOYMENT.md`, `ADMIN_ANALYTICS_ZUSAMMENFASSUNG.md`, `TEST_ANLEITUNG.md`
