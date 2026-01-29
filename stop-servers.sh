#!/bin/bash

echo "🛑 Beende Development-Server..."
echo ""

# Typische Development-Ports
PORTS=(8000 3000 5173 8080 4000)

for port in "${PORTS[@]}"; do
    pid=$(lsof -ti :$port)
    if [ ! -z "$pid" ]; then
        process=$(ps -p $pid -o comm=)
        echo "Beende Prozess auf Port $port (PID $pid, $process)..."
        kill $pid 2>/dev/null
        sleep 1
        # Falls noch aktiv, forciert beenden
        if kill -0 $pid 2>/dev/null; then
            echo "  → Forciertes Beenden..."
            kill -9 $pid 2>/dev/null
        fi
        echo "  ✅ Port $port befreit"
    else
        echo "Port $port: bereits frei"
    fi
done

echo ""
echo "✅ Fertig!"

