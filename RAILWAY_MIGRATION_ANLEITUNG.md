# Railway Migrations ausführen - Schritt für Schritt

## Problem
Die Migrations müssen auf Railway selbst ausgeführt werden, nicht lokal, da die Datenbank nur innerhalb des Railway-Netzwerks erreichbar ist.

## Lösung: Railway CLI verwenden

### Schritt 1: Railway CLI Login (im Terminal)

Öffne ein Terminal und führe aus:

```bash
cd /Users/schindlerselina/Documents/prototyp-EpiDoc-1.0/backend
railway login
```

Dies öffnet einen Browser, wo du dich bei Railway anmelden kannst.

### Schritt 2: Projekt verlinken

```bash
railway link
```

Wähle dein Projekt "Prototyp-EpiDoc" aus der Liste.

### Schritt 3: Service auswählen

```bash
railway service
```

Wähle deinen Backend-Service aus.

### Schritt 4: Migrations ausführen

```bash
railway run php artisan migrate --force
```

Dies führt die Migrations direkt auf Railway aus, mit Zugriff auf die Railway-Datenbank.

### Schritt 5: Status prüfen

```bash
railway run php artisan migrate:status
```

## Alternative: Temporärer Admin-Endpunkt

Falls Railway CLI nicht funktioniert, kann ein temporärer Admin-Endpunkt erstellt werden, der die Migrations ausführt.

**WICHTIG:** Dieser Endpunkt sollte nach dem Ausführen wieder entfernt werden!

## Troubleshooting

### "Cannot login in non-interactive mode"
- Führe `railway login` direkt im Terminal aus (nicht über Scripts)
- Ein Browser sollte sich öffnen für die Anmeldung

### "No project linked"
- Führe `railway link` aus und wähle dein Projekt

### "No service selected"
- Führe `railway service` aus und wähle deinen Backend-Service
