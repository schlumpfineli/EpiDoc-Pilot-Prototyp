#!/bin/bash
# Railway Migration Script
# Dieses Script führt Migrationen aus und loggt den Output

echo "🔄 Starte Datenbank-Migrationen..."
php artisan migrate --force
MIGRATION_EXIT_CODE=$?

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo "✅ Migrationen erfolgreich ausgeführt"
else
    echo "❌ Migrationen fehlgeschlagen (Exit Code: $MIGRATION_EXIT_CODE)"
    echo "⚠️  Server startet trotzdem..."
fi

exit 0  # Server startet immer, auch wenn Migration fehlschlägt

