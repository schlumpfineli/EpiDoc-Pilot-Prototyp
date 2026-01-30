# EpiDoc – Pilot: Sicherheit & Vorbereitung für Testuser

**Stand**: Januar 2025  
**Ziel**: Projekt für sicheres Pilot-Deployment (Vercel/Railway) mit Testusern vorbereiten

---

## 1. Sicherheit (umgesetzt)

### 1.1 Kein Klartext-Name

- **Registrierung**: Es wird kein Vor- oder Nachname abgefragt. Benutzer werden nur über ihre **User-ID** geführt (Anzeige: `User-123`).
- **API**: Das Backend gibt keinen Klartext-Namen zurück, nur `display_name` (z. B. `User-123`).
- **Profil**: Der Anzeigename ist nur lesend und zeigt die User-ID. Es gibt kein bearbeitbares Namensfeld.

### 1.2 E-Mail als Pflicht

- **Registrierung**: E-Mail ist Pflichtfeld (Login, Passwort-Reset, Benachrichtigungen).
- **Passwort vergessen**: Über E-Mail wird ein Reset-Link an die hinterlegte Adresse gesendet. Der Link zeigt auf die Frontend-URL (z. B. Vercel).
- **Probleme/Support**: E-Mail dient als Kontakt für Passwortänderungen und technische Hinweise.

### 1.3 Passwort & Authentifizierung

- Starke Passwort-Regeln (min. 8 Zeichen, Groß-/Kleinbuchstabe, Zahl).
- Passwort-Reset über E-Mail mit Token.
- Laravel Sanctum für API-Tokens.

---

## 2. Technische Änderungen (Pilot)

| Bereich | Änderung |
|--------|----------|
| **Backend** | Registrierung ohne `name`; nach Erstellung wird `name` intern auf `User-{id}` gesetzt. |
| **Backend** | API-Responses enthalten nur `display_name` (kein `name`). |
| **Backend** | Passwort-Reset: `POST /api/forgot-password`, `POST /api/reset-password`; E-Mail mit Link auf Frontend. |
| **Frontend** | Registrierungsformular: kein Namensfeld, nur E-Mail, Passwort, Rolle. |
| **Frontend** | Navbar & Profil: Anzeige `User-{id}` statt Name. |

---

## 3. Vor Übergabe an Testuser

### 3.1 Deployment (Vercel + Railway)

- [ ] **Railway**: Backend deployen, PostgreSQL, Umgebungsvariablen setzen (inkl. `FRONTEND_URL`, `APP_FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`).
- [ ] **Vercel**: Frontend deployen, `NEXT_PUBLIC_API_URL` auf Backend-URL setzen.
- [ ] **CORS**: In Railway `CORS_ALLOWED_ORIGINS` und `SANCTUM_STATEFUL_DOMAINS` auf die finale Vercel-URL setzen.

### 3.2 E-Mail (Passwort-Reset & Benachrichtigungen)

- [ ] **SendGrid oder anderer SMTP**: In Railway Variablen setzen (`MAIL_*`).
- [ ] **FRONTEND_URL**: Auf die finale Frontend-URL setzen (z. B. `https://epidoc-xxx.vercel.app`), damit Reset-Links korrekt sind.
- [ ] **Test**: „Passwort vergessen“ durchspielen und prüfen, ob E-Mail ankommt und Link funktioniert.

### 3.3 Sicherheit in Produktion

- [ ] `APP_DEBUG=false`, `APP_ENV=production` (Railway).
- [ ] `ADMIN_PASSWORD` stark und einmalig setzen.
- [ ] HTTPS wird von Vercel/Railway bereitgestellt – prüfen, dass nur HTTPS genutzt wird.

### 3.4 Testuser-Daten

- [ ] Keine echten Personendaten als Test-Accounts.
- [ ] Test-Accounts nur mit Test-E-Mails (z. B. eigene Adressen oder Wegwerf-Adressen).
- [ ] Hinweis für Testuser: Anmeldung nur mit E-Mail/Passwort, Anzeige als „User-{ID}“.

---

## 4. Kurz-Checkliste vor Pilot-Start

1. [ ] Backend auf Railway lauffähig, DB-Migrationen ausgeführt.
2. [ ] Frontend auf Vercel lauffähig, API-URL korrekt.
3. [ ] Passwort-Reset per E-Mail getestet (Link führt auf Frontend, Reset funktioniert).
4. [ ] Registrierung ohne Name getestet; Anzeige als User-ID in Navbar/Profil.
5. [ ] E-Mail-Versand (SendGrid/SMTP) konfiguriert und getestet.
6. [ ] Testuser-Anleitung bereit (Login mit E-Mail, Anzeige als User-ID, Passwort vergessen über E-Mail).

---

## 5. Weitere Hinweise

- **Datenschutz**: Kein Klartext-Name in der App – für Pilotphase reduziert das Risiko und vereinfacht die Kommunikation mit Testusern (Identifikation über User-ID).
- **Support**: Bei Problemen können Sie Nutzer über die hinterlegte E-Mail erreichen (Passwort-Reset, Hinweise).
- Ausführliche Deployment-Schritte: `RAILWAY_VERCEL_DEPLOYMENT.md`, `FINAL_DEPLOYMENT_CHECKLISTE.md`.

---

**Stand**: Januar 2025
