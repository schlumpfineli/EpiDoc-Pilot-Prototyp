    # 🚀 Server-Start Anleitung

Diese Anleitung erklärt, wie du die EpiDoc-App Server startest.

## 📋 Voraussetzungen

Stelle sicher, dass folgende Tools installiert sind:
- **PHP 8.2+** (mit Composer)
- **Node.js 18+** (mit npm)
- **SQLite** (oder MySQL/PostgreSQL)

## 🔧 Server starten

### Option 1: Manuell in separaten Terminal-Fenstern (Empfohlen)

#### Schritt 1: Backend-Server starten

1. Öffne ein **neues Terminal-Fenster**
2. Wechsle ins Backend-Verzeichnis:
   ```bash
   cd backend
   ```
3. Starte den Laravel-Server:
   ```bash
   php artisan serve
   ```
4. Das Backend läuft nun auf: **http://localhost:8000**
5. **Lasse dieses Terminal-Fenster offen!**

#### Schritt 2: Frontend-Server starten

1. Öffne ein **zweites Terminal-Fenster**
2. Wechsle ins Frontend-Verzeichnis:
   ```bash
   cd frontend
   ```
3. Starte den Next.js Development-Server:
   ```bash
   npm run dev
   ```
4. Das Frontend läuft nun auf: **http://localhost:3000**
5. **Lasse auch dieses Terminal-Fenster offen!**

### Option 2: Beide Server in einem Terminal (mit Background-Prozessen)

**Hinweis:** Diese Methode ist weniger empfohlen, da du die Logs nicht so gut siehst.

1. Öffne ein Terminal
2. Starte das Backend im Hintergrund:
   ```bash
   cd backend && php artisan serve &
   ```
3. Starte das Frontend im Hintergrund:
   ```bash
   cd frontend && npm run dev &
   ```

## ✅ Server-Status prüfen

Um zu prüfen, ob die Server laufen, kannst du das Check-Skript verwenden:

```bash
./check-servers.sh
```

Oder manuell prüfen:
```bash
# Prüfe Backend (Port 8000)
lsof -ti:8000

# Prüfe Frontend (Port 3000)
lsof -ti:3000
```

## 🌐 Zugriff auf die App

Nach dem Start beider Server:
- **Frontend (App)**: http://localhost:3000
- **Backend (API)**: http://localhost:8000/api

## 🛑 Server beenden

Um alle Server zu beenden, verwende:

```bash
./stop-servers.sh
```

Oder manuell:
- Drücke `Ctrl + C` in den jeweiligen Terminal-Fenstern
- Oder beende die Prozesse:
  ```bash
  kill $(lsof -ti:8000)  # Backend
  kill $(lsof -ti:3000)  # Frontend
  ```

## ⚠️ Wichtige Hinweise

1. **Beide Server müssen gleichzeitig laufen** - Das Frontend benötigt das Backend für die API-Anfragen
2. **Ports müssen frei sein** - Falls Port 3000 oder 8000 bereits belegt sind, musst du die anderen Prozesse zuerst beenden
3. **Erste Installation**: Falls du die App zum ersten Mal startest, musst du zuerst:
   - `composer install` im Backend-Verzeichnis ausführen
   - `npm install` im Frontend-Verzeichnis ausführen
   - Die `.env` Datei im Backend konfigurieren
   - Die Datenbank migrieren: `php artisan migrate`

## 🔍 Troubleshooting

### Port bereits belegt
```bash
# Prüfe, was auf dem Port läuft
lsof -i:8000
lsof -i:3000

# Beende den Prozess
kill -9 <PID>
```

### Backend startet nicht
- Prüfe, ob PHP installiert ist: `php -v`
- Prüfe, ob Composer installiert ist: `composer --version`
- Prüfe die `.env` Datei im Backend-Verzeichnis

### Frontend startet nicht
- Prüfe, ob Node.js installiert ist: `node -v`
- Prüfe, ob npm installiert ist: `npm -v`
- Führe `npm install` im Frontend-Verzeichnis aus

### API-Verbindungsfehler
- Stelle sicher, dass das Backend läuft (Port 8000)
- Prüfe die `.env.local` Datei im Frontend-Verzeichnis:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:8000/api
  ```

