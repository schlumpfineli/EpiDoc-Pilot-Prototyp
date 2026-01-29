#!/bin/bash

# Sichere Migration mit automatischem Backup
# Verwendung: ./scripts/migrate-safe.sh

set -e  # Beende bei Fehlern

echo "🔄 Starte sichere Migration..."

# Backup erstellen
echo "📦 Erstelle Backup..."
php artisan db:backup

if [ $? -ne 0 ]; then
    echo "❌ Backup fehlgeschlagen! Migration abgebrochen."
    exit 1
fi

echo "✅ Backup erfolgreich erstellt"

# Migration ausführen
echo "🚀 Führe Migration aus..."
php artisan migrate

if [ $? -ne 0 ]; then
    echo "❌ Migration fehlgeschlagen!"
    echo "💡 Sie können das Backup wiederherstellen, falls nötig."
    exit 1
fi

echo "✅ Migration erfolgreich abgeschlossen!"

