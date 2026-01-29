# EpiDoc - Finale Deployment-Checkliste

**Stand**: Januar 2025  
**Status**: ✅ Code bereit, Konfiguration bei Deployment nötig

Diese Checkliste führt Sie Schritt für Schritt durch das Deployment in der richtigen Reihenfolge.

---

## 📋 Vorbereitung (vor Deployment)

### ✅ Schritt 1: Code prüfen
- [x] Alle Tests bestanden
- [x] Code ist committet und gepusht
- [x] Keine kritischen Bugs bekannt
- [x] Dokumentation aktualisiert

### ✅ Schritt 2: Konfigurationsdateien
- [x] `.env.production.example` erstellt (Backend)
- [x] `.env.production.example` erstellt (Frontend)
- [x] Security Headers Middleware implementiert
- [x] Dokumentation vorhanden

---

## 🚀 Deployment (Reihenfolge beachten!)

### 1️⃣ Backend vorbereiten

#### 1.1 Repository klonen/auf Server kopieren
```bash
# Auf Server/VPS
cd /var/www
git clone https://github.com/your-repo/epidoc.git
cd epidoc/backend
```

#### 1.2 Dependencies installieren
```bash
composer install --optimize-autoloader --no-dev
```

#### 1.3 .env Datei erstellen
```bash
cp .env.production.example .env
nano .env  # Oder vim/editor Ihrer Wahl
```

**Kritische Werte setzen:**
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY=` (wird in Schritt 1.4 generiert)
- `APP_URL=https://api.epidoc.de` (Ihre Backend-URL)
- `APP_FRONTEND_URL=https://epidoc.de` (Ihre Frontend-URL)
- Datenbank-Credentials
- E-Mail-Konfiguration
- `ADMIN_PASSWORD=Ep!Doc@dmin2025#Secure$` (bereits gesetzt)

#### 1.4 App Key generieren
```bash
php artisan key:generate
```

**WICHTIG:** Der generierte Key wird automatisch in `.env` eingetragen!

#### 1.5 Berechtigungen setzen
```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

---

### 2️⃣ Datenbank einrichten

#### 2.1 Datenbank erstellen

**MySQL:**
```bash
mysql -u root -p
CREATE DATABASE epidoc_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'epidoc_user'@'localhost' IDENTIFIED BY 'SEHR_SICHERES_PASSWORT';
GRANT ALL PRIVILEGES ON epidoc_production.* TO 'epidoc_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**PostgreSQL:**
```bash
sudo -u postgres psql
CREATE DATABASE epidoc_production;
CREATE USER epidoc_user WITH ENCRYPTED PASSWORD 'SEHR_SICHERES_PASSWORT';
GRANT ALL PRIVILEGES ON DATABASE epidoc_production TO epidoc_user;
\q
```

#### 2.2 Datenbank-Credentials in .env eintragen
```env
DB_CONNECTION=mysql  # oder pgsql
DB_HOST=127.0.0.1
DB_PORT=3306  # oder 5432 für PostgreSQL
DB_DATABASE=epidoc_production
DB_USERNAME=epidoc_user
DB_PASSWORD=SEHR_SICHERES_PASSWORT
```

#### 2.3 Datenbank-Verbindung testen
```bash
php artisan tinker
DB::connection()->getPdo();
exit
```

#### 2.4 Migrationen ausführen
```bash
php artisan migrate --force
```

**Optional:** Test-Daten laden
```bash
php artisan db:seed
```

---

### 3️⃣ E-Mail-Konfiguration

#### 3.1 E-Mail-Provider wählen
- **SendGrid** (empfohlen für Produktion)
- **Mailgun**
- **Gmail SMTP** (für kleine Projekte OK)

#### 3.2 Credentials in .env eintragen

**SendGrid:**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.Ihr-SendGrid-API-Key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@epidoc.de
MAIL_FROM_NAME="EpiDoc"
```

**Gmail:**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=ihre-email@gmail.com
MAIL_PASSWORD=ihr-app-passwort
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@epidoc.de
MAIL_FROM_NAME="EpiDoc"
```

#### 3.3 E-Mail-Versand testen
```bash
php artisan tinker
Mail::raw('Test-E-Mail', function ($message) {
    $message->to('test@example.com')
            ->subject('Test von EpiDoc');
});
exit
```

---

### 4️⃣ Backend optimieren

```bash
cd /var/www/epidoc/backend

# Konfiguration cachen (für bessere Performance)
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

---

### 5️⃣ Web-Server konfigurieren (VPS)

#### 5.1 Nginx konfigurieren

Erstellen Sie `/etc/nginx/sites-available/epidoc-backend`:
```nginx
server {
    listen 80;
    server_name api.epidoc.de;
    root /var/www/epidoc/backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

#### 5.2 Nginx aktivieren
```bash
sudo ln -s /etc/nginx/sites-available/epidoc-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 6️⃣ SSL/HTTPS einrichten

#### 6.1 Let's Encrypt installieren
```bash
sudo apt install certbot python3-certbot-nginx
```

#### 6.2 SSL-Zertifikat erstellen
```bash
sudo certbot --nginx -d api.epidoc.de
```

Certbot konfiguriert automatisch HTTPS und Auto-Renewal.

---

### 7️⃣ Frontend vorbereiten

#### 7.1 Repository klonen (falls separat)
```bash
cd /var/www/epidoc/frontend
# Oder bereits vorhanden, wenn im selben Repo
```

#### 7.2 Dependencies installieren
```bash
npm install
```

#### 7.3 .env.local erstellen
```bash
cp .env.production.example .env.local
nano .env.local
```

**Kritische Werte setzen:**
- `NEXT_PUBLIC_API_URL=https://api.epidoc.de/api`

#### 7.4 Production Build erstellen
```bash
npm run build
```

**WICHTIG:** Build muss ohne Fehler durchlaufen!

---

### 8️⃣ Frontend deployen

#### Option A: Vercel (Empfohlen)

1. **Projekt importieren**
   - Zu https://vercel.com gehen
   - "Add New" → "Project"
   - Repository wählen
   - Root Directory: `frontend`

2. **Environment Variables setzen**
   - Settings → Environment Variables
   - `NEXT_PUBLIC_API_URL=https://api.epidoc.de/api`

3. **Deployen**
   - Automatisch bei jedem Push auf `main`
   - Oder manuell: "Deploy"

#### Option B: VPS mit PM2

```bash
cd /var/www/epidoc/frontend

# PM2 installieren (falls nicht vorhanden)
npm install -g pm2

# Ecosystem-Datei erstellen
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'epidoc-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/epidoc/frontend',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: 'https://api.epidoc.de/api'
    }
  }]
};
EOF

# Starten
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Folgen Sie den Anweisungen
```

#### Option C: Docker (Optional)

Siehe `DEPLOYMENT.md` für Docker-Konfiguration.

---

### 9️⃣ CORS konfigurieren (falls noch nicht gesetzt)

**Backend .env prüfen:**
```env
CORS_ALLOWED_ORIGINS=https://epidoc.de,https://www.epidoc.de
FRONTEND_URL=https://epidoc.de
```

**In `bootstrap/app.php` ist CORS bereits konfiguriert.**

---

### 🔟 Finale Tests

#### 10.1 Backend-Tests
```bash
cd /var/www/epidoc/backend

# Health Check
curl https://api.epidoc.de/up

# API-Endpunkt testen
curl https://api.epidoc.de/api/user
```

#### 10.2 Frontend-Tests
- [ ] Frontend lädt: `https://epidoc.de`
- [ ] Login funktioniert
- [ ] Registrierung funktioniert
- [ ] Passwort-Reset funktioniert (E-Mail wird gesendet)
- [ ] CRUD-Operationen funktionieren
- [ ] API-Verbindung funktioniert

#### 10.3 Sicherheits-Tests
- [ ] HTTPS aktiv (kein HTTP)
- [ ] `APP_DEBUG=false` (keine Fehlermeldungen sichtbar)
- [ ] CORS funktioniert (keine CORS-Fehler in Browser)
- [ ] Security Headers vorhanden (prüfen mit Browser DevTools)

---

## ✅ Post-Deployment Checkliste

### Backend
- [ ] `APP_DEBUG=false` gesetzt
- [ ] `APP_ENV=production` gesetzt
- [ ] `APP_KEY` generiert
- [ ] Datenbank-Migrationen ausgeführt
- [ ] Berechtigungen korrekt (775 für storage/cache)
- [ ] Konfiguration gecacht
- [ ] SSL/HTTPS aktiv
- [ ] E-Mail-Versand funktioniert
- [ ] Logs prüfen: `tail -f storage/logs/laravel.log`

### Frontend
- [ ] `.env.local` korrekt konfiguriert
- [ ] Production Build erfolgreich
- [ ] API-URL korrekt
- [ ] HTTPS aktiv
- [ ] Domain konfiguriert

### Allgemein
- [ ] Backup-System funktioniert
- [ ] Monitoring eingerichtet (optional)
- [ ] Domain-DNS korrekt
- [ ] Alle Funktionen getestet
- [ ] Keine Fehler in Logs

---

## 🐛 Troubleshooting

### Backend startet nicht
```bash
# Logs prüfen
tail -f storage/logs/laravel.log

# Berechtigungen prüfen
ls -la storage bootstrap/cache

# Konfiguration neu laden
php artisan config:clear
php artisan cache:clear
```

### Datenbank-Verbindung fehlgeschlagen
```bash
# Verbindung testen
php artisan tinker
DB::connection()->getPdo();

# .env prüfen
cat .env | grep DB_
```

### CORS-Fehler
- Prüfen Sie `CORS_ALLOWED_ORIGINS` in `.env`
- Prüfen Sie `bootstrap/app.php` CORS-Konfiguration
- Browser-Cache leeren

### E-Mail wird nicht gesendet
```bash
# Test-Mail senden
php artisan tinker
Mail::raw('Test', function($m) { $m->to('test@example.com')->subject('Test'); });

# Logs prüfen
tail -f storage/logs/laravel.log
```

---

## 📊 Deployment-Status

### ✅ Bereit
- Code vollständig implementiert
- Konfigurationsdateien erstellt
- Security Headers implementiert
- Dokumentation vorhanden

### ⏭️ Bei Deployment nötig
- `.env` Dateien anpassen
- Datenbank einrichten
- E-Mail konfigurieren
- SSL/HTTPS einrichten
- Deployen & testen

---

## ⏱️ Geschätzter Zeitaufwand

- **Backend Setup**: 1-2 Stunden
- **Datenbank Setup**: 30 Minuten
- **E-Mail Setup**: 30 Minuten
- **Frontend Setup**: 1 Stunde
- **Testing**: 1 Stunde

**Gesamt:** ~4-5 Stunden

---

**Nächster Schritt:** Wählen Sie Ihre Deployment-Methode (Vercel+Railway, VPS, etc.) und folgen Sie der entsprechenden Anleitung in `DEPLOYMENT.md`.

---

**Stand**: Januar 2025

