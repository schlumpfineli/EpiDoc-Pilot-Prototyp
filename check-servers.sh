#!/bin/bash

echo "🔍 Prüfe laufende Development-Server..."
echo ""

# Typische Development-Ports
PORTS=(8000 3000 5173 8080 4000)

for port in "${PORTS[@]}"; do
    pid=$(lsof -ti :$port)
    if [ ! -z "$pid" ]; then
        process=$(ps -p $pid -o comm=)
        echo "⚠️  Port $port: PID $pid ($process)"
    else
        echo "✅ Port $port: frei"
    fi
done

echo ""
echo "📋 Alle laufenden Server-Prozesse:"
lsof -i -P | grep LISTEN | grep -E "(node|php|python|ruby|java)" || echo "Keine Development-Server gefunden"

