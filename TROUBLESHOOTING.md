# EpiDoc - Troubleshooting-Guide

Dieser Guide hilft bei der Lösung häufiger Probleme, die während der Entwicklung und beim Betrieb der EpiDoc-App auftreten können.

---

## 📋 Inhaltsverzeichnis

1. [Server-Start-Probleme](#server-start-probleme)
2. [Datenbank-Probleme](#datenbank-probleme)
3. [Authentifizierungs-Probleme](#authentifizierungs-probleme)
4. [API-Verbindungsfehler](#api-verbindungsfehler)
5. [Frontend-Build-Probleme](#frontend-build-probleme)
6. [CORS-Probleme](#cors-probleme)
7. [Token-Probleme](#token-probleme)
8. [Migration-Probleme](#migration-probleme)
9. [Performance-Probleme](#performance-probleme)
10. [Häufige Fehlermeldungen](#häufige-fehlermeldungen)

---

## 🚀 Server-Start-Probleme

### Problem: Port bereits belegt

**Symptome:**
- `Address already in use` Fehler
- Server startet nicht

**Lösung:**
```bash
# Prüfe, was auf dem Port läuft
lsof -i:8000  # Backend (Port 8000)
lsof -i:3000  # Frontend (Port 3000)

# Beende den Prozess
kill -9 <PID>

# Oder beende alle Prozesse auf dem Port
kill $(lsof -ti:8000)  # Backend
kill $(lsof -ti:3000)  # Frontend
```

**Alternative:** Verwende andere Ports:
```bash
# Backend auf Port 8001
php artisan serve --port=8001

# Frontend auf Port 3001
PORT=3001 npm run dev
```

---

### Problem: Backend startet nicht

**Symptome:**
- `php artisan serve` schlägt fehl
- Fehlermeldungen beim Start

**Lösungsschritte:**

1. **PHP-Version prüfen:**
```bash
php -v  # Sollte PHP 8.2 oder höher sein
```

2. **Composer Dependencies neu installieren:**
```bash
cd backend
rm -rf vendor composer.lock
composer install
```

3. **Laravel Cache löschen:**
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

4. **App Key generieren:**
```bash
php artisan key:generate
```

5. **Berechtigungen prüfen:**
```bash
# Storage-Verzeichnis muss beschreibbar sein
chmod -R 775 storage bootstrap/cache
```

---

### Problem: Frontend startet nicht

**Symptome:**
- `npm run dev` schlägt fehl
- Build-Fehler

**Lösungsschritte:**

1. **Node.js-Version prüfen:**
```bash
node -v  # Sollte Node.js 18 oder höher sein
npm -v
```

2. **Node Modules neu installieren:**
```bash
cd frontend
rm -rf node_modules package-lock.json .next
npm install
```

3. **npm Cache löschen:**
```bash
npm cache clean --force
```

4. **Next.js Cache löschen:**
```bash
rm -rf .next
npm run dev
```

---

## 💾 Datenbank-Probleme

### Problem: Migration schlägt fehl

**Symptome:**
- `Migration failed` Fehler
- Datenbank-Fehler

**Lösung:**

1. **Sichere Migration mit Backup verwenden:**
```bash
php artisan migrate:safe
```

2. **Migrationen zurücksetzen und neu ausführen:**
```bash
# VORSICHT: Löscht alle Daten!
php artisan migrate:fresh
```

3. **Einzelne Migration zurücksetzen:**
```bash
php artisan migrate:rollback --step=1
```

4. **Datenbank neu erstellen (SQLite):**
```bash
rm database/database.sqlite
touch database/database.sqlite
php artisan migrate
```

---

### Problem: Datenbank-Verbindungsfehler

**Symptome:**
- `SQLSTATE[HY000] [2002] Connection refused`
- `Could not find driver`

**Lösung:**

1. **SQLite-Treiber prüfen:**
```bash
php -m | grep sqlite
# Falls nicht vorhanden, installieren:
# Ubuntu/Debian: sudo apt-get install php-sqlite3
# macOS: php ist normalerweise mit sqlite3 ausgestattet
```

2. **Datenbank-Datei prüfen:**
```bash
# Prüfe, ob die Datei existiert
ls -la backend/database/database.sqlite

# Prüfe Berechtigungen
chmod 664 backend/database/database.sqlite
```

3. **.env Datei prüfen:**
```env
DB_CONNECTION=sqlite
DB_DATABASE=/absoluter/pfad/zur/database.sqlite
# Oder relativ:
DB_DATABASE=database/database.sqlite
```

---

### Problem: Datenverlust nach Migration

**Symptome:**
- Daten fehlen nach Migration
- Tabellen leer

**Lösung:**

1. **Backup wiederherstellen:**
```bash
# Backups finden
ls -la backend/database/backups/

# SQLite Backup wiederherstellen
cp backend/database/backups/backup_YYYY-MM-DD_HH-MM-SS.sqlite backend/database/database.sqlite
```

2. **Migration rückgängig machen:**
```bash
php artisan migrate:rollback
```

3. **Zukünftig: Immer migrate:safe verwenden:**
```bash
php artisan migrate:safe  # Erstellt automatisch Backup
```

---

## 🔐 Authentifizierungs-Probleme

### Problem: Login funktioniert nicht

**Symptome:**
- "Ungültige Zugangsdaten" Fehler
- Token wird nicht gespeichert

**Lösung:**

1. **Passwort-Stärke prüfen:**
   - Mindestens 8 Zeichen
   - Mindestens 1 Großbuchstabe
   - Mindestens 1 Kleinbuchstabe
   - Mindestens 1 Zahl

2. **Backend-Logs prüfen:**
```bash
tail -f backend/storage/logs/laravel.log
```

3. **Token-Speicherung prüfen (Frontend):**
   - Browser DevTools öffnen
   - Application → Local Storage prüfen
   - `auth_token` und `auth_token_data` sollten vorhanden sein

4. **CORS prüfen:**
   - Siehe [CORS-Probleme](#cors-probleme)

---

### Problem: Token abgelaufen / Benutzer wird abgemeldet

**Symptome:**
- Benutzer wird automatisch abgemeldet
- 401 Unauthorized Fehler

**Lösung:**

1. **Token-Ablaufzeit prüfen:**
   - Standard: 168 Stunden (7 Tage)
   - Konfigurierbar in `backend/.env`:
   ```env
   SANCTUM_EXPIRATION_MINUTES=10080  # 168 Stunden
   ```

2. **Token-Refresh prüfen:**
   - Das Frontend sollte automatisch Tokens erneuern
   - Prüfe Browser Console auf Fehler

3. **Manuell neu anmelden:**
   - Logout → Login

---

### Problem: Passwort-Reset funktioniert nicht

**Symptome:**
- Reset-Link wird nicht angezeigt/versendet
- Token ungültig

**Lösung:**

1. **Prototyp-Modus beachten:**
   - Im Prototyp wird der Reset-Link direkt auf der Seite angezeigt
   - Wird nicht per E-Mail versendet (E-Mail-Server nicht konfiguriert)

2. **Token-Gültigkeit prüfen:**
   - Token ist 1 Stunde gültig
   - Nach Ablauf: Neuen Reset-Link anfordern

3. **Passwort-Stärke beachten:**
   - Siehe [Login funktioniert nicht](#problem-login-funktioniert-nicht)

---

## 🌐 API-Verbindungsfehler

### Problem: CORS-Fehler

**Symptome:**
- `Access-Control-Allow-Origin` Fehler im Browser
- API-Anfragen werden blockiert

**Lösung:**

1. **Backend CORS-Konfiguration prüfen:**
```php
// backend/bootstrap/app.php
// Stelle sicher, dass FRONTEND_URL korrekt gesetzt ist
```

2. **.env Datei prüfen:**
```env
FRONTEND_URL=http://localhost:3000
APP_URL=http://localhost:8000
```

3. **CORS-Middleware prüfen:**
   - Sollte in `bootstrap/app.php` registriert sein
   - Prüfe, ob `HandleCors` Middleware aktiv ist

4. **Browser-Cache löschen:**
   - Hard Refresh: `Ctrl+Shift+R` (Windows/Linux) oder `Cmd+Shift+R` (macOS)

---

### Problem: 500 Internal Server Error

**Symptome:**
- API gibt 500 Fehler zurück
- Keine detaillierte Fehlermeldung

**Lösung:**

1. **Backend-Logs prüfen:**
```bash
tail -f backend/storage/logs/laravel.log
```

2. **Debug-Modus aktivieren:**
```env
# backend/.env
APP_DEBUG=true
LOG_LEVEL=debug
```

3. **Häufige Ursachen:**
   - Datenbank-Verbindungsfehler
   - Fehlende Umgebungsvariablen
   - Fehlerhafte Migrationen
   - Fehlende Berechtigungen

---

### Problem: 401 Unauthorized

**Symptome:**
- API gibt 401 Fehler zurück
- "Nicht authentifiziert" Meldung

**Lösung:**

1. **Token prüfen:**
   - Ist Token im Local Storage vorhanden?
   - Ist Token abgelaufen?
   - Wird Token im Authorization-Header gesendet?

2. **Token-Format prüfen:**
   - Sollte sein: `Bearer <token>`
   - Prüfe Browser DevTools → Network → Headers

3. **Token erneuern:**
   - Logout → Login
   - Oder Token-Refresh-Endpoint verwenden: `POST /api/token/refresh`

---

### Problem: 422 Validation Error

**Symptome:**
- API gibt 422 Fehler zurück
- Validierungsfehler-Meldungen

**Lösung:**

1. **Fehlermeldungen lesen:**
   - Die API gibt detaillierte Validierungsfehler zurück
   - Prüfe `errors` Objekt in der Response

2. **Häufige Validierungsfehler:**
   - Passwort-Stärke nicht erfüllt
   - Pflichtfelder fehlen
   - Falsche Datentypen
   - Ungültige Werte (z.B. Enum-Werte)

3. **Frontend-Validierung prüfen:**
   - Prüfe, ob Zod-Schemas korrekt sind
   - Prüfe, ob alle Pflichtfelder ausgefüllt sind

---

## 🏗️ Frontend-Build-Probleme

### Problem: Build schlägt fehl

**Symptome:**
- `npm run build` schlägt fehl
- TypeScript-Fehler
- Module nicht gefunden

**Lösung:**

1. **TypeScript-Fehler beheben:**
```bash
cd frontend
npx tsc --noEmit  # Prüft TypeScript-Fehler ohne Build
```

2. **Node Modules neu installieren:**
```bash
rm -rf node_modules package-lock.json .next
npm install
```

3. **Cache löschen:**
```bash
rm -rf .next
npm cache clean --force
```

4. **Build mit mehr Details:**
```bash
npm run build -- --debug
```

---

### Problem: Hydration Mismatch

**Symptome:**
- React Hydration Mismatch Warnung
- Unterschiede zwischen Server und Client

**Lösung:**

1. **Ursachen prüfen:**
   - `Math.random()` oder `Date.now()` in Komponenten
   - Unterschiedliche Werte zwischen SSR und Client
   - Browser-spezifische APIs während SSR

2. **Lösung:**
   - Verwende `useState` und `useEffect` für client-spezifische Werte
   - Prüfe auf `typeof window !== 'undefined'`
   - Verwende statische Werte während SSR

---

### Problem: Chunk Loading Error

**Symptome:**
- "Failed to load chunk" Fehler
- Module nicht gefunden

**Lösung:**

1. **Next.js Cache löschen:**
```bash
cd frontend
rm -rf .next
npm run dev
```

2. **Node Modules neu installieren:**
```bash
rm -rf node_modules package-lock.json
npm install
```

3. **Browser-Cache löschen:**
   - Hard Refresh: `Ctrl+Shift+R` oder `Cmd+Shift+R`
   - Oder: Browser DevTools → Application → Clear Storage

---

## 🔄 Token-Probleme

### Problem: Token wird nicht gespeichert

**Symptome:**
- Nach Login wird Token nicht gespeichert
- Benutzer wird sofort abgemeldet

**Lösung:**

1. **Local Storage prüfen:**
   - Browser DevTools → Application → Local Storage
   - Sollte `auth_token` und `auth_token_data` enthalten

2. **Browser-Berechtigungen prüfen:**
   - Local Storage muss aktiviert sein
   - Keine Browser-Erweiterungen, die Local Storage blockieren

3. **Token-Refresh prüfen:**
   - Prüfe `frontend/lib/tokenRefresh.ts`
   - Prüfe Browser Console auf Fehler

---

### Problem: Token-Refresh schlägt fehl

**Symptome:**
- Token wird nicht automatisch erneuert
- Benutzer wird abgemeldet nach 7 Tagen

**Lösung:**

1. **Token-Refresh-Endpoint prüfen:**
```bash
# Teste manuell
curl -X POST http://localhost:8000/api/token/refresh \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

2. **Gnadenfrist prüfen:**
   - Token kann bis zu 168 Stunden (7 Tage) nach Ablauf erneuert werden
   - Danach: Neu anmelden erforderlich

3. **Backend-Logs prüfen:**
```bash
tail -f backend/storage/logs/laravel.log
```

---

## 📊 Migration-Probleme

### Problem: Migration schlägt fehl

**Symptome:**
- `Migration failed` Fehler
- Datenbank-Fehler

**Lösung:**

1. **Immer migrate:safe verwenden:**
```bash
php artisan migrate:safe
```

2. **Einzelne Migration testen:**
```bash
php artisan migrate --path=database/migrations/YYYY_MM_DD_HHMMSS_migration_name.php
```

3. **Migration zurücksetzen:**
```bash
php artisan migrate:rollback --step=1
```

4. **Datenbank-Status prüfen:**
```bash
php artisan migrate:status
```

---

### Problem: Migration hängt

**Symptome:**
- Migration läuft endlos
- Keine Ausgabe

**Lösung:**

1. **Migration abbrechen:**
   - `Ctrl+C` drücken
   - Prozess beenden

2. **Datenbank-Status prüfen:**
```bash
php artisan migrate:status
```

3. **Manuell prüfen:**
   - Prüfe `migrations` Tabelle in der Datenbank
   - Prüfe, ob Migration bereits ausgeführt wurde

---

## ⚡ Performance-Probleme

### Problem: App lädt langsam

**Symptome:**
- Lange Ladezeiten
- Langsame API-Antworten

**Lösung:**

1. **Laravel Cache aktivieren:**
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

2. **Frontend Build optimieren:**
```bash
cd frontend
npm run build
# Verwende Production Build statt Development
```

3. **Datenbank-Indizes prüfen:**
   - Prüfe, ob Indizes auf häufig abgefragten Spalten existieren
   - Siehe Migrationen für Index-Definitionen

---

### Problem: Viele API-Anfragen

**Symptome:**
- Zu viele API-Aufrufe
- Langsame Performance

**Lösung:**

1. **Rate Limiting prüfen:**
   - Backend hat Rate Limiting aktiviert
   - Prüfe, ob zu viele Anfragen gesendet werden

2. **Caching implementieren:**
   - Für häufig abgerufene Daten
   - Frontend: React Query oder ähnlich
   - Backend: Laravel Cache

---

## 🐛 Häufige Fehlermeldungen

### "Class not found"

**Lösung:**
```bash
# Composer Autoload neu generieren
cd backend
composer dump-autoload
```

---

### "Route not found"

**Lösung:**
```bash
# Route Cache löschen
php artisan route:clear

# Route Cache neu erstellen
php artisan route:cache
```

---

### "Method not allowed"

**Lösung:**
- Prüfe HTTP-Methode (GET, POST, PUT, DELETE)
- Prüfe Route-Definition in `routes/api.php`

---

### "Token has expired"

**Lösung:**
- Token ist abgelaufen (nach 7 Tagen)
- Neu anmelden erforderlich
- Oder Token-Refresh versuchen (wenn noch in Gnadenfrist)

---

### "SQLSTATE[HY000]: General error: 1 no such table"

**Lösung:**
```bash
# Migrationen ausführen
php artisan migrate
```

---

## 🔍 Debug-Tipps

### Backend Debugging

1. **Logs aktivieren:**
```env
APP_DEBUG=true
LOG_LEVEL=debug
```

2. **Logs ansehen:**
```bash
tail -f backend/storage/logs/laravel.log
```

3. **Tinker verwenden:**
```bash
php artisan tinker
# Teste Code interaktiv
```

---

### Frontend Debugging

1. **Browser DevTools:**
   - Console: JavaScript-Fehler
   - Network: API-Anfragen
   - Application: Local Storage, Session Storage

2. **React DevTools:**
   - Installiere React DevTools Browser-Erweiterung
   - Prüfe Komponenten-State

3. **Next.js Debug-Modus:**
```bash
NODE_OPTIONS='--inspect' npm run dev
```

---

## 📞 Weitere Hilfe

### Dokumentation
- **API-Dokumentation:** `backend/API_DOCUMENTATION.md`
- **Deployment-Anleitung:** `DEPLOYMENT.md`
- **Server-Start-Anleitung:** `SERVER_START_ANLEITUNG.md`
- **Sicherheitsdokumentation:** `backend/SECURITY.md`

### Logs prüfen
- **Backend:** `backend/storage/logs/laravel.log`
- **Frontend:** Browser Console (F12)

### Tests ausführen
```bash
# Backend Tests
cd backend
php artisan test

# Alle Tests
php artisan test --filter=TestName
```

---

## ✅ Checkliste für häufige Probleme

Wenn etwas nicht funktioniert, gehe diese Liste durch:

- [ ] Beide Server laufen (Backend: Port 8000, Frontend: Port 3000)
- [ ] `.env` Dateien sind korrekt konfiguriert
- [ ] Dependencies sind installiert (`composer install`, `npm install`)
- [ ] Datenbank-Migrationen sind ausgeführt (`php artisan migrate`)
- [ ] Browser-Cache wurde gelöscht (Hard Refresh)
- [ ] Keine CORS-Fehler in der Browser Console
- [ ] Token ist im Local Storage vorhanden
- [ ] Backend-Logs zeigen keine Fehler
- [ ] Ports sind nicht belegt

---

## 🚀 Deployment-Probleme (Vercel/Railway)

### Problem: Website zeigt nur "Lädt..." - 404 Fehler für statische Assets

**Symptome:**
- Code wird erfolgreich auf GitHub gepusht
- Vercel/Railway zeigt erfolgreichen Build an
- Website zeigt nur "Lädt..." an
- Browser-Konsole zeigt 404-Fehler für JavaScript/CSS-Dateien:
  - `Failed to load resource: the server responded with a status of 404`
  - Fehler für Dateien unter `/next/static/chunks/`

**Ursachen:**
1. **Next.js Build-Konfiguration fehlt oder ist unvollständig**
2. **React 19 Kompatibilitätsprobleme mit Next.js 16.0.7**
3. **Build schlägt fehl, wird aber als erfolgreich angezeigt**
4. **Statische Assets werden nicht korrekt generiert**

**Lösungsschritte:**

#### 1. Next.js-Konfiguration prüfen

Stelle sicher, dass `frontend/next.config.ts` korrekt konfiguriert ist:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  swcMinify: true,
  // ... weitere Konfiguration
};

export default nextConfig;
```

#### 2. Vercel-Konfiguration prüfen

Erstelle oder aktualisiere `frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

#### 3. Build lokal testen

Teste den Build lokal, bevor du auf GitHub pushst:

```bash
cd frontend
rm -rf .next node_modules package-lock.json
npm install
npm run build
npm run start  # Teste Production-Build lokal
```

**Wichtig:** Der Build muss ohne Fehler durchlaufen!

#### 4. Vercel Build-Logs prüfen

1. Gehe zu deinem Vercel-Dashboard
2. Öffne das Projekt
3. Klicke auf "Deployments"
4. Öffne das neueste Deployment
5. Prüfe die **Build-Logs** auf Fehler

**Achte auf:**
- TypeScript-Fehler
- Module nicht gefunden
- Build-Warnungen
- Fehlende Umgebungsvariablen

#### 5. Umgebungsvariablen prüfen

Stelle sicher, dass alle benötigten Umgebungsvariablen in Vercel gesetzt sind:

```env
NEXT_PUBLIC_API_URL=https://ihr-backend.railway.app/api
NEXT_PUBLIC_APP_NAME=EpiDoc
```

**Wichtig:** 
- Variablen müssen mit `NEXT_PUBLIC_` beginnen, um im Browser verfügbar zu sein
- Nach Änderungen: Neues Deployment auslösen

#### 6. React/Next.js Version-Kompatibilität prüfen

React 19.2.0 könnte Kompatibilitätsprobleme mit Next.js 16.0.7 haben.

**Option A: Next.js aktualisieren (empfohlen)**
```bash
cd frontend
npm install next@latest
```

**Option B: React downgraden (falls Next.js-Update nicht möglich)**
```bash
cd frontend
npm install react@^18.3.1 react-dom@^18.3.1
```

#### 7. Vercel-Projekt neu konfigurieren

Falls das Problem weiterhin besteht:

1. Gehe zu Vercel Dashboard → Projekt → Settings
2. Prüfe **Build & Development Settings**:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`
3. Speichere und trigger ein neues Deployment

#### 8. Cache löschen

Manchmal hilft es, den Vercel-Cache zu löschen:

1. Vercel Dashboard → Projekt → Settings
2. Scroll zu **"Clear Build Cache"**
3. Klicke auf **"Clear"**
4. Trigger ein neues Deployment

#### 9. Browser-Cache löschen

Nach erfolgreichem Deployment:

1. Öffne die Website im Browser
2. Hard Refresh: `Ctrl+Shift+R` (Windows/Linux) oder `Cmd+Shift+R` (Mac)
3. Oder: Browser DevTools → Application → Clear Storage → Clear site data

#### 10. Network-Tab prüfen

Im Browser DevTools → Network-Tab:

1. Prüfe, welche Requests fehlschlagen
2. Prüfe die **Request-URLs** - sind sie korrekt?
3. Prüfe die **Response-Headers** - gibt es Redirects?

**Häufige Probleme:**
- Assets werden unter falschem Pfad gesucht
- Base-Path ist falsch konfiguriert
- Assets werden nicht korrekt ausgeliefert

---

### Problem: Build schlägt auf Vercel fehl

**Symptome:**
- Build-Logs zeigen Fehler
- Deployment schlägt fehl

**Lösung:**

1. **TypeScript-Fehler beheben:**
```bash
cd frontend
npx tsc --noEmit
```

2. **Lokalen Build testen:**
```bash
npm run build
```

3. **Node-Version prüfen:**
   - Vercel verwendet automatisch die Node-Version aus `package.json`
   - Oder setze `.nvmrc` oder `engines` in `package.json`:
   ```json
   {
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```

4. **Dependencies prüfen:**
   - Stelle sicher, dass alle Dependencies korrekt installiert sind
   - Prüfe `package-lock.json` ist committed

---

### Problem: API-Verbindung funktioniert nicht nach Deployment

**Symptome:**
- Frontend lädt, aber API-Calls schlagen fehl
- CORS-Fehler in der Konsole

**Lösung:**

1. **Backend CORS konfigurieren:**
   - Prüfe `CORS_ALLOWED_ORIGINS` in Railway
   - Muss die exakte Vercel-URL enthalten (mit `https://`)

2. **Frontend API-URL prüfen:**
   - Prüfe `NEXT_PUBLIC_API_URL` in Vercel
   - Muss mit `https://` beginnen
   - Format: `https://ihr-backend.railway.app/api`

3. **Backend neu deployen:**
   - Nach Änderung der CORS-Einstellungen: Railway neu deployen

---

**Letzte Aktualisierung:** Januar 2025

