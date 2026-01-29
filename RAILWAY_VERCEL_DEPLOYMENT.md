# EpiDoc - Railway + Vercel Deployment Anleitung

**Stand**: Januar 2025  
**Ziel**: Prototyp auf Railway (Backend) + Vercel (Frontend) deployen

Diese Anleitung führt Sie Schritt für Schritt durch das Deployment auf Railway und Vercel.

---

## 📋 Voraussetzungen

### Accounts (kostenlos für Prototyp)
- ✅ GitHub Account (kostenlos)
- ✅ Railway Account (kostenlos, https://railway.app)
- ✅ Vercel Account (kostenlos, https://vercel.com)

### Repository
- ✅ Code auf GitHub (oder vorbereitet zum Pushen)

---

## 🚂 Teil 1: Backend auf Railway deployen

### Schritt 1: Railway Account erstellen

1. Gehen Sie zu **https://railway.app**
2. Klicken Sie auf **"Start a New Project"**
3. Wählen Sie **"Login with GitHub"** (empfohlen)
4. Autorisiere Railway, auf Ihr GitHub-Konto zuzugreifen

### Schritt 2: Projekt erstellen

1. Klicken Sie auf **"New Project"**
2. Wählen Sie **"Deploy from GitHub repo"**
3. Wählen Sie Ihr Repository aus
4. Railway erkennt automatisch, dass es ein Laravel-Projekt ist

### Schritt 3: Service konfigurieren

1. **Root Directory setzen:**
   - Klicken Sie auf das Service
   - Settings → Root Directory → `backend`

2. **Build Command** (automatisch erkannt über `nixpacks.toml`, prüfen):
   - Railway verwendet die `backend/nixpacks.toml` Konfiguration
   - Diese wird automatisch erkannt

3. **Start Command:**
   ```
   php artisan serve --host=0.0.0.0 --port=$PORT
   ```
   - Wird ebenfalls aus `nixpacks.toml` gelesen

**Hinweis:** Die `backend/nixpacks.toml` Datei ist bereits im Repository enthalten und konfiguriert den Build-Prozess für Railway.

### Schritt 4: PostgreSQL Datenbank hinzufügen

1. Klicken Sie auf **"+ New"** im Projekt
2. Wählen Sie **"Database"** → **"Add PostgreSQL"**
3. Railway erstellt automatisch eine PostgreSQL-Datenbank
4. Die Verbindungsdaten werden als Umgebungsvariablen verfügbar sein

### Schritt 5: Umgebungsvariablen setzen

Gehen Sie zu **Variables** und fügen Sie folgende Variablen hinzu:

#### App-Konfiguration
```env
APP_NAME=EpiDoc
APP_ENV=production
APP_DEBUG=false
APP_KEY=
APP_TIMEZONE=UTC
APP_LOCALE=de
```

**WICHTIG:** `APP_KEY` wird automatisch generiert (siehe Schritt 6)

#### Datenbank (Railway setzt diese automatisch)
```env
DB_CONNECTION=pgsql
DB_THOS=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_DATABASE=${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
```

#### App-URLs (später anpassen)
```env
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
APP_FRONTEND_URL=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

#### E-Mail-Konfiguration (SendGrid empfohlen)

**Option 1: SendGrid (kostenlos)**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.ihr-sendgrid-api-key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="EpiDoc"
```

**Option 2: Gmail (für Prototyp OK)**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=ihre-email@gmail.com
MAIL_PASSWORD=ihr-app-passwort
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="EpiDoc"
```

#### Admin-Passwort
```env
ADMIN_PASSWORD=Ep!Doc@dmin2025#Secure$
```

#### Sanctum
```env
SANCTUM_STATEFUL_DOMAINS=your-frontend.vercel.app
SANCTUM_EXPIRATION_HOURS=168
```

### Schritt 6: App Key generieren

1. Nach dem ersten Deployment: Öffnen Sie die **Railway Shell**
2. Führen Sie aus:
   ```bash
   php artisan key:generate --force
   ```
3. **Kopieren Sie den generierten `APP_KEY`**
4. Fügen Sie ihn in Railway Variables ein:
   - Variable: `APP_KEY`
   - Value: `base64:...` (der generierte Key)

### Schritt 7: Datenbank-Migrationen ausführen

In der **Railway Shell**:

```bash
php artisan migrate --force
```

**Optional:** Test-Daten laden
```bash
php artisan db:seed
```

### Schritt 8: Domain konfigurieren (Optional)

1. Klicken Sie auf das Service → **Settings**
2. Unter **"Networking"** → **"Generate Domain"**
3. Railway generiert eine Domain wie: `epidoc-production.up.railway.app`
4. **Kopieren Sie diese URL** - Sie benötigen sie für Vercel

**WICHTIG:** Notieren Sie sich die Backend-URL! Sie wird für Frontend-Konfiguration benötigt.

---

## ⚡ Teil 2: Frontend auf Vercel deployen

### Schritt 1: Vercel Account erstellen

1. Gehen Sie zu **https://vercel.com**
2. Klicken Sie auf **"Sign Up"**
3. Wählen Sie **"Continue with GitHub"**
4. Autorisiere Vercel, auf Ihr GitHub-Konto zuzugreifen

### Schritt 2: Projekt importieren

1. Klicken Sie auf **"Add New..."** → **"Project"**
2. Wählen Sie Ihr Repository aus
3. Klicken Sie auf **"Import"**

### Schritt 3: Projekt konfigurieren

1. **Framework Preset:** Next.js (automatisch erkannt)

2. **Root Directory:**
   ```
   frontend
   ```

3. **Build Command:**
   ```
   npm run build
   ```
   (automatisch erkannt)

4. **Output Directory:**
   ```
   .next
   ```
   (automatisch erkannt)

5. **Install Command:**
   ```
   npm install
   ```
   (automatisch erkannt)

### Schritt 4: Umgebungsvariablen setzen

Klicken Sie auf **"Environment Variables"** und fügen Sie hinzu:

```env
NEXT_PUBLIC_API_URL=https://ihr-backend.railway.app/api
NEXT_PUBLIC_APP_NAME=EpiDoc
```

**WICHTIG:** 
- Verwenden Sie die **Backend-URL von Railway** (aus Schritt 8, Teil 1)
- Die URL muss mit `https://` beginnen!
- Format: `https://ihr-service.up.railway.app/api`

### Schritt 5: Deployen

1. Klicken Sie auf **"Deploy"**
2. Vercel baut und deployed automatisch
3. Warten Sie, bis der Build erfolgreich ist (~2-3 Minuten)

### Schritt 6: Domain notieren

1. Nach erfolgreichem Deployment erhalten Sie eine URL wie:
   ```
   https://epidoc-xxxxx.vercel.app
   ```
2. **Kopieren Sie diese URL** - Sie benötigen sie für Backend-CORS

---

## 🔗 Teil 3: Backend und Frontend verbinden

### Schritt 1: Backend CORS aktualisieren

Gehen Sie zurück zu **Railway** → **Variables** und aktualisieren Sie:

```env
APP_FRONTEND_URL=https://ihr-frontend.vercel.app
FRONTEND_URL=https://ihr-frontend.vercel.app
CORS_ALLOWED_ORIGINS=https://ihr-frontend.vercel.app
SANCTUM_STATEFUL_DOMAINS=ihr-frontend.vercel.app
```

**WICHTIG:** Verwenden Sie die **Vercel-URL** aus Schritt 6, Teil 2!

### Schritt 2: Backend neu deployen

1. Railway deployed automatisch bei Änderungen
2. Oder: Klicken Sie auf **"Redeploy"**

---

## ✅ Teil 4: Testing

### Schritt 1: Frontend testen

1. Öffnen Sie die Vercel-URL im Browser
2. Testen Sie:
   - [ ] Login funktioniert
   - [ ] Registrierung funktioniert
   - [ ] Passwort-Reset funktioniert (E-Mail wird gesendet)
   - [ ] CRUD-Operationen funktionieren
   - [ ] API-Verbindung funktioniert

### Schritt 2: E-Mail-Versand testen

1. Gehen Sie zu Login-Seite
2. Klicken Sie auf "Passwort vergessen"
3. Geben Sie eine E-Mail-Adresse ein
4. **Prüfen Sie Ihr E-Mail-Postfach**
5. Klicken Sie auf den Reset-Link
6. Setzen Sie ein neues Passwort

### Schritt 3: Admin-Bereich testen

1. Backend-URL aufrufen: `https://ihr-backend.railway.app/feedback`
2. Mit Admin-Passwort anmelden: `Ep!Doc@dmin2025#Secure$`
3. Feedback-Meldungen sollten angezeigt werden

---

## 🔧 Troubleshooting

### Backend startet nicht

**Problem:** `APP_KEY` fehlt
```bash
# In Railway Shell:
php artisan key:generate --force
# Key kopieren und in Variables eintragen
```

**Problem:** Datenbank-Verbindung fehlgeschlagen
- Prüfen Sie, ob PostgreSQL hinzugefügt wurde
- Prüfen Sie die DB-Variablen in Railway

### Frontend kann nicht auf Backend zugreifen

**Problem:** CORS-Fehler
- Prüfen Sie `CORS_ALLOWED_ORIGINS` in Railway
- Verwenden Sie exakte Vercel-URL (mit https://)
- Backend neu deployen

**Problem:** 401 Unauthorized
- Prüfen Sie `SANCTUM_STATEFUL_DOMAINS`
- Prüfen Sie, ob Frontend-URL korrekt ist

### E-Mail wird nicht gesendet

**Problem:** E-Mail-Konfiguration falsch
- Prüfen Sie SendGrid API-Key
- Prüfen Sie Railway Logs: `railway logs`

---

## 📊 Deployment-Status prüfen

### Railway

1. Gehen Sie zu Ihrem Projekt
2. Klicken Sie auf das Service
3. **Logs** prüfen
4. **Metrics** prüfen

### Vercel

1. Gehen Sie zu Ihrem Projekt
2. **Deployments** prüfen
3. **Logs** prüfen
4. **Analytics** prüfen (optional)

---

## 🔐 Sicherheit nach Deployment

### ✅ Prüfen Sie:

- [ ] `APP_DEBUG=false` in Railway
- [ ] `APP_ENV=production` in Railway
- [ ] `ADMIN_PASSWORD` geändert (✅ bereits erledigt)
- [ ] HTTPS aktiv (automatisch bei Railway/Vercel)
- [ ] CORS korrekt konfiguriert
- [ ] E-Mail-Versand funktioniert

---

## 📝 Nächste Schritte

Nach erfolgreichem Deployment:

1. **Feedback sammeln** von Testern
2. **Features priorisieren** basierend auf Feedback
3. **Offene Punkte ergänzen** iterativ
4. **Monitoring einrichten** (optional: Sentry, Analytics)

---

## 🎯 Zusammenfassung

### Railway (Backend)
- ✅ PostgreSQL automatisch
- ✅ Automatisches SSL/HTTPS
- ✅ Einfaches Deployment
- ✅ Kostenlos für Prototyp

### Vercel (Frontend)
- ✅ Automatisches SSL/HTTPS
- ✅ Einfaches Deployment
- ✅ Automatische Builds bei Git-Push
- ✅ Kostenlos für Prototyp

**Geschätzter Zeitaufwand:** 2-3 Stunden

---

**Stand**: Januar 2025

