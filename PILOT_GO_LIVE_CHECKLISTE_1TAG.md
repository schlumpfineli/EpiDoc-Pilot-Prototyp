# EpiDoc – 1-Tages Go-Live-Checkliste (Pilot)

**Ziel:** Am selben Tag sicher deployen, kritische Pfade testen, Testpersonen per Link einladen und bei Problemen schnell reagieren.

**Voraussetzung:** Code ist auf dem Branch/Tag, den ihr deployen wollt (z. B. `main`).

---

## Teil A – Vormittag: Vorbereitung (ca. 1–2 Std.)

### A1. Rollen klären

- [x] **Technische Verantwortung:** Ich (deployed / ändert Umgebungsvariablen)
- [x] **Support:** Ich (beantworten von Fragen der Testpersonen (E-Mail/Telefon))?
- [x] **Datenschutz:** Ich (Ansprechpartner bei Rückfragen zu Daten?)

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

- [x] `APP_ENV=production`, `APP_DEBUG=false`
- [x] `APP_KEY` gesetzt (nicht leer)
- [x] `ADMIN_PASSWORD` auf ein **starkes, eigenes** Passwort gesetzt (nicht Standard `admin123`)
- [x] Datenbank: Migrationen auf Production ausgeführt (`php artisan migrate --force`)
- [x] CORS: `CORS_ALLOWED_ORIGINS` / `FRONTEND_URL` = exakte Frontend-URL (mit `https://`)
- [x] Frontend: `NEXT_PUBLIC_API_URL` = `https://<backend>/api` (mit `/api` am Ende)

### A4. E-Mail (falls Passwort-Reset im Pilot genutzt wird)

- [ ] SMTP/Provider in Railway konfiguriert
- [ ] Test: „Passwort vergessen“ mit einer echten E-Mail durchspielen
- [ ] Pilot-Workaround kommuniziert: "Falls das Zurücksetzen des Passworts nicht direkt funktioniert, melde dich bitte kurz bei mir, ich unterstütze dich sofort."

> **Hinweis:** Ohne funktionierendes E-Mail können Tester bei vergessenem Passwort nicht selbst zurücksetzen – dann Support-Kanal bereithalten (siehe Teil D).

### A5. Manueller Passwort-Reset (Support-Workaround)

Wenn der E-Mail-Reset im Pilot nicht zuverlässig funktioniert, kann das Passwort manuell gesetzt werden.

1. Terminal öffnen und ins Backend wechseln:
   ```bash
   cd "/Users/schindlerselina/Documents/EpiDoc-Pilot/backend"
   ```
2. Tinker mit Railway-Umgebung starten:
   ```bash
   railway run php artisan tinker
   ```
3. In Tinker Benutzer laden (E-Mail anpassen):
   ```php
   use App\Models\User;
   use Illuminate\Support\Facades\Hash;

   $user = User::where('email', 'BENUTZER@MAIL.DE')->first();
   $user !== null;
   ```
4. Temporäres Passwort setzen:
   ```php
   $user->password = Hash::make('TempPasswort123');
   $user->save();
   ```
5. Optional prüfen:
   ```php
   Hash::check('TempPasswort123', $user->fresh()->password);
   ```
6. Tinker beenden:
   ```php
   exit
   ```

**Danach Benutzer informieren:**
- Login über `https://epi-doc-pilot-prototyp.vercel.app/login`
- Temporäres Passwort nur einmal verwenden
- Direkt in `Einstellungen` auf ein eigenes Passwort ändern

---

## Teil B – Mittag: Deployment & Smoke-Tests (ca. 1–2 Std.)

Folgt inhaltlich eurer Anleitung `RAILWAY_VERCEL_DEPLOYMENT.md`. Hier die **minimalen Smoke-Tests** direkt nach Go-Live.

### B1. Öffentliche Seiten

- [x] Frontend lädt ohne Fehler (Startseite oder Login)
- [x] Keine sichtbaren Stack-Traces / Laravel-Fehlerseiten

### B2. Registrierung (Pilot-Kern)

- [x] `…/register` öffnen
- [x] Neuen Test-Account mit **eigener** Test-E-Mail anlegen (Rolle Patient oder Angehöriger)
- [x] Nach Registrierung: Weiterleitung funktioniert (z. B. ins Tagebuch/Diary)
- [x] Abmelden → erneut **Login** mit denselben Zugangsdaten

### B3. Geschützte Bereiche (eingeloggt)

- [x] Mindestens **einen** Befinden-Eintrag speichern
- [x] Mindestens **einen** Anfall-Eintrag speichern (falls im Pilot genutzt)
- [x] Seitenwechsel (Navigation) ohne harte Fehler

### B4. API-Verbindung (bei Problemen zuerst hier schauen)

- [x] Browser-Konsole: keine durchgehenden CORS-Fehler
- [x] Bei 401 nach Login: Token/Session prüfen, ggf. `SANCTUM_STATEFUL_DOMAINS` / Cookie-Einstellungen

### B5. Admin (nur Team, nicht an Tester weitergeben)

- [x] `…/admin/analytics` mit Admin-Passwort erreichbar
- [x] Optional: `…/feedback` – Feedback-Liste lädt

---

## Teil C – Nachmittag: Testpersonen einladen (ca. 30–60 Min.)

### C1. Einen klaren Pilot-Link verschicken

**Empfohlener Textbaustein (anpassen):**

> Liebe Testperson,  
> bitte öffnet die App unter: **`<Frontend-URL>/register`**  
> Legt dort ein Konto mit eurer E-Mail und einem sicheren Passwort an.  
> Bei Fragen oder technischen Problemen: **`<Support-E-Mail oder Telefon>`**  
> Vielen Dank!

**Copy/Paste Vorlage (Du-Form):**

> Hallo zusammen  
>   
> der EpiDoc-Pilot ist jetzt live.  
> Bitte registriert euch über folgenden Link:  
>   
> `https://epi-doc-pilot-prototyp.vercel.app/register`  
>   
> Nach der Registrierung könnt ihr euch direkt mit eurer E-Mail und eurem Passwort einloggen und die App testen.  
>   
> Wichtige Hinweise:  
> - Der Pilot ist eine Testphase, daher können vereinzelt technische Probleme auftreten.  
> - Die App ersetzt keine medizinische Beratung oder Behandlung.  
> - Bitte nutzt möglichst einen aktuellen Browser (Chrome oder Safari) und eine stabile Internetverbindung.  
> - Falls etwas nicht funktioniert oder ihr Fragen habt, meldet euch bitte direkt bei mir.  
> - Falls das Zurücksetzen des Passworts nicht direkt funktioniert, unterstütze ich euch sofort manuell.  
> - Supportzeiten: täglich von 9-17 Uhr. Rückmeldung innert 2 Tagen. Ausnahme: kein Support vom 26. April bis 4. Mai.  
>   
> Vielen Dank für eure Unterstützung!

- [x] Link ist **HTTPS**
- [x] Link zeigt auf **`/register`** (oder Startseite mit gut sichtbarem „Konto erstellen“)
- [x] Kurze Anleitung: Browser (Chrome/Safari aktuell), stabile Internetverbindung

### C2. Erwartungen setzen

- [x] Pilot = kann Bugs haben; Feedback ist erwünscht
- [x] Keine medizinische Beratung durch die App
- [x] Support-Zeiten nennen (z. B. 9–17 Uhr)
- [x] Kommunikationssatz verwenden: "Falls das Zurücksetzen des Passworts nicht direkt funktioniert, melde dich bitte kurz bei mir, ich unterstütze dich sofort."

### C3. Sammeln von Rückmeldungen

- [x] Ein Kanal festlegen: E-Mail, Formular, oder strukturierte Vorlage aus `TEST_ANLEITUNG.md`

> **Hinweis:** Rückmeldungen aus der App sind im Admin-Bereich unter `/feedback` sichtbar (nach erfolgreichem Admin-Login).

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

- [x] **Vercel:** In `Deployments` das letzte stabile Deployment auswählen und per `...` -> `Promote to Production` wieder aktiv setzen.
- [x] **Railway:** In `Deployments` das letzte stabile Release wieder deployen (alternativ auf Commit `9a68785` zurückrollen, falls Mail-/Reset-Änderungen Probleme machen).
- [x] **Nach Rollback sofort prüfen:** Smoke-Tests B1-B3 erneut durchführen (`/login`, `/register`, Eintrag speichern, Logout/Login).

**Kurzablauf im Störfall (Copy/Paste intern):**
1. Vercel auf letztes stabiles Deployment promoten.
2. Railway auf letztes stabiles Release redeployen.
3. Browser-Cache leeren und Hard Reload.
4. B1-B3 Smoke-Tests durchspielen.
5. Tester kurz informieren (Vorlage unter D3).

### D3. Kommunikation an Tester

Kurze Vorlage:

> Es gab ein technisches Problem. Bitte die Seite neu laden oder den Link erneut verwenden: `<URL>`. Wir arbeiten an einer Lösung und melden uns bei Bedarf.

**Copy/Paste Vorlage (inkl. Supportzeiten):**

> Hallo zusammen  
>   
> aktuell gibt es ein technisches Problem im Pilot.  
> Bitte ladet die Seite neu oder verwendet den Link erneut:  
> `https://epi-doc-pilot-prototyp.vercel.app/register`  
>   
> Wir arbeiten bereits an der Lösung und melden uns bei Bedarf direkt bei euch.  
>   
> Supportzeiten: täglich von 9-17 Uhr. Rückmeldung innert 2 Tagen.  
> Ausnahme: kein Support vom 26. April bis 4. Mai.  
>   
> Vielen Dank für euer Verständnis.

---

## Teil E – Tagesabschluss (15–30 Min.)

- [ ] Anzahl neue Registrierungen grob notiert (Admin Analytics oder DB-Export – je nach eurem Vorgehen)
- [ ] Offene Fehlerliste (kurz): kritisch vs. später
- [ ] Backup-Status: wurde heute ein Backup ausgelöst bzw. ist der DB-Dump-Plan klar? (`PILOT_START_CHECKLISTE.md` / Backend-Backup-Command)

**Tagesabschluss (heute):**
- Pilot-Link live und geteilt.
- Kernfunktionen B1-B4 erfolgreich getestet.
- Offene Punkte: Admin-Login, Passwort-Reset-E-Mail-Zustellung.
- Aktiver Workaround: manueller Passwort-Reset via Support.
- Nächster Fokus: Admin-Bereich reparieren und E-Mail-Zustellung finalisieren.

---

## Optional: Nächster Tag

- [ ] DSGVO-Texte/Einwilligungen nachziehen, falls noch nicht live
- [ ] Monitoring (Logs täglich kurz ansehen)
- [ ] Entscheidung: Offene Registrierung beibehalten oder später **Invite-Code / Whitelist** einführen

---

**Stand:** März 2026  
**Bezug:** `RAILWAY_VERCEL_DEPLOYMENT.md`, `ADMIN_ANALYTICS_ZUSAMMENFASSUNG.md`, `TEST_ANLEITUNG.md`
