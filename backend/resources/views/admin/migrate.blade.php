<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>EpiDoc - Migrationen</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2563eb;
            margin-bottom: 10px;
        }
        .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .warning strong {
            color: #92400e;
        }
        .status {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
        }
        .status-item {
            padding: 15px;
            background: #f9fafb;
            border-radius: 6px;
        }
        .status-item strong {
            display: block;
            margin-bottom: 5px;
        }
        .status-item.exists {
            color: #10b981;
        }
        .status-item.missing {
            color: #ef4444;
        }
        button {
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        button:hover {
            background: #1d4ed8;
        }
        button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }
        .output {
            margin-top: 20px;
            padding: 15px;
            background: #1f2937;
            color: #f9fafb;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            white-space: pre-wrap;
            max-height: 400px;
            overflow-y: auto;
            display: none;
        }
        .output.show {
            display: block;
        }
        .success {
            background: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            color: #065f46;
        }
        .error {
            background: #fee2e2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            color: #991b1b;
        }
        .nav-links {
            margin-bottom: 20px;
        }
        .nav-links a {
            display: inline-block;
            padding: 8px 16px;
            margin-right: 10px;
            background: #e5e7eb;
            color: #333;
            text-decoration: none;
            border-radius: 6px;
            transition: background 0.2s;
        }
        .nav-links a:hover {
            background: #d1d5db;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="nav-links">
            <a href="/feedback">📝 Feedback</a>
            <a href="/admin/analytics">📊 Analytics</a>
            <a href="/admin/logout">🚪 Abmelden</a>
        </div>

        <h1>🔄 Datenbank-Migrationen</h1>
        
        <div class="warning">
            <strong>⚠️ WICHTIG:</strong> Diese Seite ist nur für die Pilot-Phase gedacht und sollte nach der Migration entfernt werden!
        </div>

        <div class="status">
            <div class="status-item">
                <strong>Feedback-Tabelle:</strong>
                <span class="{{ $migrationStatus['feedback_table_exists'] ? 'exists' : 'missing' }}">
                    {{ $migrationStatus['feedback_table_exists'] ? '✅ Existiert' : '❌ Fehlt' }}
                </span>
            </div>
            <div class="status-item">
                <strong>Usage Logs-Tabelle:</strong>
                <span class="{{ $migrationStatus['usage_logs_table_exists'] ? 'exists' : 'missing' }}">
                    {{ $migrationStatus['usage_logs_table_exists'] ? '✅ Existiert' : '❌ Fehlt' }}
                </span>
            </div>
        </div>

        <button id="migrateBtn" onclick="runMigration()">Migrationen ausführen</button>

        <div id="output" class="output"></div>
        <div id="message"></div>
    </div>

    <script>
        async function runMigration() {
            const btn = document.getElementById('migrateBtn');
            const output = document.getElementById('output');
            const message = document.getElementById('message');
            
            btn.disabled = true;
            output.classList.add('show');
            output.textContent = 'Migration wird ausgeführt...';
            message.innerHTML = '';

            try {
                const response = await fetch('/admin/migrate/run', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '{{ csrf_token() }}',
                        'Accept': 'application/json'
                    },
                });

                const data = await response.json();

                if (data.success) {
                    output.textContent = data.output || 'Migration erfolgreich';
                    message.innerHTML = '<div class="success">✅ ' + data.message + '</div>';
                    // Seite nach 2 Sekunden neu laden, um Status zu aktualisieren
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    output.textContent = data.error || 'Unbekannter Fehler';
                    message.innerHTML = '<div class="error">❌ ' + data.message + '</div>';
                }
            } catch (error) {
                output.textContent = 'Fehler: ' + error.message;
                message.innerHTML = '<div class="error">❌ Fehler beim Ausführen der Migration</div>';
            } finally {
                btn.disabled = false;
            }
        }
    </script>
</body>
</html>

