# EpiDoc - Deployment Checkliste

**Stand**: Januar 2025  
**Für**: Railway (Backend) + Vercel (Frontend)

Diese Checkliste begleitet Sie während des Deployments. ✅ = Erledigt

---

## 📋 Vorbereitung

### Accounts erstellen
- [ ] GitHub Account vorhanden (Repository: `schlumpfineli/Prototyp-EpiDoc`)
- [ ] Railway Account erstellt (https://railway.app)
- [ ] Vercel Account erstellt (https://vercel.com)

### Code vorbereiten
- [ ] Code auf GitHub gepusht
- [ ] Alle Änderungen committed
- [ ] `.env` Dateien NICHT committed (in `.gitignore`)

---

## 🚂 Railway (Backend)

### Schritt 1: Projekt erstellen
- [ ] Railway Dashboard öffnen
- [ ] "New Project" geklickt
- [ ] "Deploy from GitHub repo" gewählt
- [ ] Repository `schlumpfineli/Prototyp-EpiDoc` ausgewählt
- [ ] Projekt erstellt

### Schritt 2: Service konfigurieren
- [ ] Service öffnen
- [ ] Settings → Root Directory → `backend` gesetzt
- [ ] Build Command geprüft: `composer install --optimize-autoloader --no-dev`
- [ ] Start Command gesetzt: `php artisan serve --host=0.0.0.0 --port=$PORT`

### Schritt 3: PostgreSQL Datenbank
- [ ] "+ New" → "Database" → "Add PostgreSQL" geklickt
- [ ] PostgreSQL-Datenbank erstellt
- [ ] DB-Verbindungsvariablen notiert (werden automatisch verfügbar sein)

### Schritt 4: Umgebungsvariablen setzen

#### App-Konfiguration
- [ ] `APP_NAME=EpiDoc`
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_KEY=` (wird später generiert)
- [ ] `APP_TIMEZONE=UTC`
- [ ] `APP_LOCALE=de`

#### Datenbank (Railway-Variablen)
- [ ] `DB_CONNECTION=pgsql`
- [ ] `DB_HOST=${{Postgres.PGHOST}}`
- [ ] `DB_PORT=${{Postgres.PGPORT}}`
- [ ] `DB_DATABASE=${{Postgres.PGDATABASE}}`
- [ ] `DB_USERNAME=${{Postgres.PGUSER}}`
- [ ] `DB_PASSWORD=${{Postgres.PGPASSWORD}}`

#### URLs (später anpassen nach Frontend-Deployment)
- [ ] `APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}`
- [ ] `APP_FRONTEND_URL=https://ihr-frontend.vercel.app` (PLATZHALTER)
- [ ] `FRONTEND_URL=https://ihr-frontend.vercel.app` (PLATZHALTER)
- [ ] `CORS_ALLOWED_ORIGINS=https://ihr-frontend.vercel.app` (PLATZHALTER)
- [ ] `SANCTUM_STATEFUL_DOMAINS=ihr-frontend.vercel.app` (PLATZHALTER)

#### E-Mail (SendGrid empfohlen)
- [ ] SendGrid Account erstellt (oder Gmail App-Passwort)
- [ ] `MAIL_MAILER=smtp`
- [ ] `MAIL_HOST=smtp.sendgrid.net` (oder `smtp.gmail.com`)
- [ ] `MAIL_PORT=587`
- [ ] `MAIL_USERNAME=apikey` (SendGrid) oder Gmail-Adresse
- [ ] `MAIL_PASSWORD=SG.ihr-api-key` (SendGrid API-Key)
- [ ] `MAIL_ENCRYPTION=tls`
- [ ] `MAIL_FROM_ADDRESS=noreply@yourdomain.com`
- [ ] `MAIL_FROM_NAME=EpiDoc`

#### Admin & Sanctum
- [ ] `ADMIN_PASSWORD=Ep!Doc@dmin2025#Secure$`
- [ ] `SANCTUM_EXPIRATION_HOURS=168`

### Schritt 5: Erstes Deployment
- [ ] Railway deployed automatisch
- [ ] Deployment erfolgreich (grüner Status)

### Schritt 6: App Key generieren
- [ ] Railway Shell geöffnet (Service → Deployments → Shell)
- [ ] `php artisan key:generate --force` ausgeführt
- [ ] Generierten `APP_KEY` kopiert (Format: `base64:...`)
- [ ] In Railway Variables → `APP_KEY` → Wert eingefügt
- [ ] Service neu deployed

### Schritt 7: Datenbank-Migrationen
- [ ] Railway Shell geöffnet
- [ ] `php artisan migrate --force` ausgeführt
- [ ] Migrationen erfolgreich

### Schritt 8: Domain notieren
- [ ] Service → Settings → Networking
- [ ] "Generate Domain" geklickt
- [ ] Backend-URL notiert: `https://ihr-service.up.railway.app`
- [ ] ✅ **BACKEND-URL FÜR VERCEL BEREIT**

---

## ⚡ Vercel (Frontend)

### Schritt 1: Projekt importieren
- [ ] Vercel Dashboard geöffnet
- [ ] "Add New..." → "Project" geklickt
- [ ] Repository `schlumpfineli/Prototyp-EpiDoc` ausgewählt
- [ ] "Import" geklickt

### Schritt 2: Projekt konfigurieren
- [ ] Framework Preset: `Next.js` (automatisch erkannt)
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm run build` (automatisch)
- [ ] Output Directory: `.next` (automatisch)
- [ ] Install Command: `npm install` (automatisch)

### Schritt 3: Umgebungsvariablen setzen
- [ ] "Environment Variables" geöffnet
- [ ] `NEXT_PUBLIC_API_URL=https://ihr-backend.railway.app/api` gesetzt
  - **WICHTIG**: Backend-URL von Railway (Schritt 8) verwenden!
  - Format: `https://ihr-service.up.railway.app/api`
- [ ] `NEXT_PUBLIC_APP_NAME=EpiDoc` gesetzt

### Schritt 4: Deployen
- [ ] "Deploy" geklickt
- [ ] Build erfolgreich (grüner Status)
- [ ] Deployment URL notiert: `https://epidoc-xxxxx.vercel.app`
- [ ] ✅ **FRONTEND-URL FÜR RAILWAY BEREIT**

---

## 🔗 Backend und Frontend verbinden

### Schritt 1: Railway CORS aktualisieren
- [ ] Railway → Variables geöffnet
- [ ] `APP_FRONTEND_URL` auf Vercel-URL aktualisiert
- [ ] `FRONTEND_URL` auf Vercel-URL aktualisiert
- [ ] `CORS_ALLOWED_ORIGINS` auf Vercel-URL aktualisiert (Format: `https://epidoc-xxxxx.vercel.app`)
- [ ] `SANCTUM_STATEFUL_DOMAINS` auf Vercel-Domain aktualisiert (Format: `epidoc-xxxxx.vercel.app` ohne https://)

### Schritt 2: Railway neu deployen
- [ ] Railway deployed automatisch (oder manuell "Redeploy")
- [ ] Deployment erfolgreich

---

## ✅ Testing

### Funktionstests
- [ ] Frontend-URL im Browser geöffnet
- [ ] Login-Seite lädt
- [ ] Registrierung funktioniert
- [ ] Login funktioniert
- [ ] Dashboard/Startseite lädt nach Login
- [ ] CRUD-Operationen funktionieren (Befinden, Anfälle, Medikamente)
- [ ] Einstellungen-Seite lädt

### E-Mail-Versand testen
- [ ] "Passwort vergessen" geklickt
- [ ] E-Mail-Adresse eingegeben
- [ ] E-Mail erhalten (Postfach prüfen)
- [ ] Reset-Link funktioniert
- [ ] Passwort erfolgreich zurückgesetzt

### Admin-Bereich testen
- [ ] Backend-URL aufrufen: `https://ihr-backend.railway.app/feedback`
- [ ] Admin-Login-Seite erscheint
- [ ] Admin-Passwort eingegeben: `Ep!Doc@dmin2025#Secure$`
- [ ] Feedback-Übersicht erscheint
- [ ] Feedback-Meldungen werden angezeigt

---

## 🔐 Sicherheit prüfen

- [ ] `APP_DEBUG=false` in Railway
- [ ] `APP_ENV=production` in Railway
- [ ] `ADMIN_PASSWORD` geändert (falls gewünscht)
- [ ] HTTPS aktiv (automatisch bei Railway/Vercel)
- [ ] CORS korrekt konfiguriert
- [ ] `.env` Dateien NICHT im Repository
- [ ] E-Mail-Versand funktioniert

---

## 📝 Deployment-Informationen notieren

**Backend (Railway):**
- URL: `https://________________________`
- Admin-URL: `https://________________________/feedback`
- Admin-Passwort: `Ep!Doc@dmin2025#Secure$`

**Frontend (Vercel):**
- URL: `https://________________________`

**E-Mail:**
- Provider: ________________________
- Von-Adresse: ________________________

---

## 🎉 Deployment abgeschlossen!

- [ ] Alle Tests erfolgreich
- [ ] Funktionalität geprüft
- [ ] Sicherheit geprüft
- [ ] Dokumentation aktualisiert (optional)

**Herzlichen Glückwunsch! Der Prototyp ist jetzt live! 🚀**

---

## 📚 Nächste Schritte

1. **Feedback sammeln** von Testern
2. **Monitoring einrichten** (optional: Sentry, Analytics)
3. **Features priorisieren** basierend auf Feedback
4. **Offene Punkte ergänzen** iterativ

---

**Stand**: Januar 2025

