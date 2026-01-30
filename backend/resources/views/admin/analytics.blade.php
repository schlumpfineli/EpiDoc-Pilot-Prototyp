<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EpiDoc - Nutzungsstatistiken</title>
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
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            color: #2563eb;
            margin-bottom: 10px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
            gap: 15px;
        }
        .nav-links {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .nav-links a {
            padding: 10px 20px;
            background: white;
            color: #333;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .nav-links a:hover {
            background: #2563eb;
            color: white;
        }
        .nav-links a.logout {
            background: #ef4444;
            color: white;
        }
        .nav-links a.logout:hover {
            background: #dc2626;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-card strong {
            display: block;
            font-size: 32px;
            color: #2563eb;
            margin-bottom: 5px;
        }
        .stat-card span {
            font-size: 14px;
            color: #666;
        }
        .stat-card.error strong {
            color: #ef4444;
        }
        .stat-card.success strong {
            color: #10b981;
        }
        .section {
            background: white;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .section h2 {
            color: #2563eb;
            margin-bottom: 20px;
            font-size: 20px;
        }
        .function-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .function-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #f9fafb;
            border-radius: 6px;
            border-left: 4px solid #2563eb;
        }
        .function-item.least-used {
            border-left-color: #f59e0b;
        }
        .function-name {
            font-weight: 600;
            color: #333;
            font-size: 16px;
        }
        .function-count {
            font-size: 18px;
            color: #2563eb;
            font-weight: 600;
        }
        .function-percentage {
            font-size: 14px;
            color: #666;
            margin-left: 10px;
        }
        .date-filter {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .date-filter form {
            display: flex;
            gap: 15px;
            align-items: end;
            flex-wrap: wrap;
        }
        .date-filter label {
            display: flex;
            flex-direction: column;
            gap: 5px;
            font-size: 14px;
            color: #666;
        }
        .date-filter input {
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
        }
        .date-filter button {
            padding: 8px 20px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        .date-filter button:hover {
            background: #1d4ed8;
        }
        .empty {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }
        .info-box {
            background: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .info-box p {
            color: #1e40af;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1>📊 EpiDoc - Nutzungsstatistiken</h1>
                <p style="color: #666; margin-top: 5px;">Admin-Bereich - Anonymisierte Funktionsanalysen</p>
            </div>
            <div class="nav-links">
                <a href="/feedback">📝 Feedback</a>
                <a href="/admin/logout" class="logout">🚪 Abmelden</a>
            </div>
        </div>

        <div class="info-box">
            <p><strong>ℹ️ Hinweis:</strong> Alle Daten sind vollständig anonymisiert. Es werden keine Benutzer-IDs oder persönlichen Informationen gespeichert.</p>
            <p style="margin-top: 8px;"><strong>Pilot:</strong> Sie haben hier Zugriff auf anonyme Nutzungsdaten der Testpersonen. Kontaktanfragen der Nutzer finden Sie unter <a href="/feedback" style="color: #1e40af; text-decoration: underline;">Feedback</a>.</p>
        </div>

        @if(!isset($tableExists) || !$tableExists)
            <div class="warning-box" style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p><strong>⚠️ Warnung:</strong> Die Datenbanktabelle für Nutzungsstatistiken existiert noch nicht. Bitte führen Sie die Migrationen aus: <a href="/admin/migrate" style="color: #2563eb; text-decoration: underline;">Migrationen ausführen</a></p>
            </div>
        @endif

        <div class="date-filter">
            <form method="GET" action="/admin/analytics">
                <label>
                    Von:
                    <input type="date" name="start_date" value="{{ $startDate }}" required>
                </label>
                <label>
                    Bis:
                    <input type="date" name="end_date" value="{{ $endDate }}" required>
                </label>
                <button type="submit">Aktualisieren</button>
            </form>
        </div>

        {{-- Registrierungen nach Rolle (anonym) --}}
        <div class="section">
            <h2>👥 Registrierungen nach Rolle</h2>
            <p style="color: #666; margin-bottom: 15px;">Anzahl angemeldeter Nutzer – nur Anzahlen, keine personenbezogenen Daten.</p>
            <div class="stats">
                <div class="stat-card">
                    <strong>{{ number_format($usersPatient ?? 0, 0, ',', '.') }}</strong>
                    <span>Patienten</span>
                </div>
                <div class="stat-card">
                    <strong>{{ number_format($usersRelative ?? 0, 0, ',', '.') }}</strong>
                    <span>Angehörige</span>
                </div>
                <div class="stat-card success">
                    <strong>{{ number_format(($usersPatient ?? 0) + ($usersRelative ?? 0), 0, ',', '.') }}</strong>
                    <span>Gesamt registriert</span>
                </div>
            </div>
        </div>

        <div class="stats">
            <div class="stat-card">
                <strong>{{ number_format($total, 0, ',', '.') }}</strong>
                <span>Gesamt Anfragen</span>
            </div>
            <div class="stat-card error">
                <strong>{{ number_format($errors, 0, ',', '.') }}</strong>
                <span>Fehler</span>
            </div>
            <div class="stat-card success">
                <strong>{{ $total > 0 ? number_format((($total - $errors) / $total) * 100, 1) : 0 }}%</strong>
                <span>Erfolgsrate</span>
            </div>
            <div class="stat-card">
                <strong>{{ $total > 0 ? number_format(($errors / $total) * 100, 2) : 0 }}%</strong>
                <span>Fehlerrate</span>
            </div>
        </div>

        @if($topFunctions->count() > 0)
            <div class="section">
                <h2>🔥 Meist genutzte Funktionen</h2>
                <div class="function-list">
                    @foreach($topFunctions as $function)
                        @php
                            $percentage = $total > 0 ? round(($function->count / $total) * 100, 1) : 0;
                        @endphp
                        <div class="function-item">
                            <div>
                                <div class="function-name">
                                    @if($function->function_name == 'befinden') 📊 Befinden
                                    @elseif($function->function_name == 'seizures') 📝 Tagebuch
                                    @elseif($function->function_name == 'medications') 💊 Medikamente
                                    @else {{ $function->function_name }}
                                    @endif
                                </div>
                            </div>
                            <div>
                                <span class="function-count">{{ number_format($function->count, 0, ',', '.') }}</span>
                                <span class="function-percentage">({{ $percentage }}%)</span>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif

        @if($leastUsedFunctions->count() > 0)
            <div class="section">
                <h2>⚠️ Wenig genutzte Funktionen</h2>
                <div class="function-list">
                    @foreach($leastUsedFunctions as $function)
                        @php
                            $percentage = $total > 0 ? round(($function->count / $total) * 100, 1) : 0;
                        @endphp
                        <div class="function-item least-used">
                            <div>
                                <div class="function-name">
                                    @if($function->function_name == 'befinden') 📊 Befinden
                                    @elseif($function->function_name == 'seizures') 📝 Tagebuch
                                    @elseif($function->function_name == 'medications') 💊 Medikamente
                                    @else {{ $function->function_name }}
                                    @endif
                                </div>
                            </div>
                            <div>
                                <span class="function-count">{{ number_format($function->count, 0, ',', '.') }}</span>
                                <span class="function-percentage">({{ $percentage }}%)</span>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif

        {{-- Beschwerden/Symptome (Befinden) --}}
        @if(isset($symptomMostUsed) && ($symptomMostUsed->count() > 0 || $symptomNeverUsed->count() > 0))
            <div class="section">
                <h2>📋 Beschwerden / Symptome (Befinden)</h2>
                @if($symptomMostUsed->count() > 0)
                    <h3 style="font-size: 16px; color: #333; margin-bottom: 12px;">Am häufigsten genutzt</h3>
                    <div class="function-list">
                        @foreach($symptomMostUsed as $row)
                            <div class="function-item">
                                <div class="function-name">{{ $row->label }}</div>
                                <span class="function-count">{{ number_format($row->count, 0, ',', '.') }} Einträge</span>
                            </div>
                        @endforeach
                    </div>
                @endif
                @if($symptomNeverUsed->count() > 0)
                    <h3 style="font-size: 16px; color: #333; margin: 20px 0 12px;">Im Zeitraum nie genutzt</h3>
                    <div class="function-list">
                        @foreach($symptomNeverUsed as $row)
                            <div class="function-item least-used">
                                <div class="function-name">{{ $row->label }}</div>
                                <span class="function-percentage">0</span>
                            </div>
                        @endforeach
                    </div>
                @endif
            </div>
        @endif

        {{-- Eigene Symptome (anonym) --}}
        @if(isset($customSymptomsList) && $customSymptomsList->count() > 0)
            <div class="section">
                <h2>✏️ Eigene Symptome (anonym)</h2>
                <p style="color: #666; margin-bottom: 15px;">Von Benutzern eingetragene Symptome – nur Anzeigename und Nutzungshäufigkeit im Zeitraum, keine Benutzerzuordnung.</p>
                <div class="function-list">
                    @foreach($customSymptomsList as $row)
                        <div class="function-item">
                            <div class="function-name">{{ $row->label }}</div>
                            <span class="function-count">{{ number_format($row->count, 0, ',', '.') }} Einträge</span>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif

        {{-- Seitenaufrufe --}}
        @if(isset($pageViewsTableExists) && $pageViewsTableExists && ($pageViewsByPath->count() > 0 || $pageViewsTotal > 0))
            <div class="section">
                <h2>📄 Seitenaufrufe</h2>
                <p style="color: #666; margin-bottom: 15px;">Welche Seiten wurden wie oft aufgerufen (Gesamt: {{ number_format($pageViewsTotal, 0, ',', '.') }})</p>
                <div class="function-list">
                    @foreach($pageViewsByPath as $row)
                        <div class="function-item">
                            <div class="function-name">{{ $row->path }}</div>
                            <span class="function-count">{{ number_format($row->count, 0, ',', '.') }}</span>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif

        {{-- Zeit in der App (User-Sessions) --}}
        @if(isset($userSessionsTableExists) && $userSessionsTableExists && $userSessionsTotal >= 0)
            <div class="section">
                <h2>⏱️ Nutzungszeit in der App</h2>
                <div class="stats" style="margin-top: 15px;">
                    <div class="stat-card">
                        <strong>{{ number_format($avgMinutesPerDay ?? 0, 1, ',', '.') }}</strong>
                        <span>Ø Minuten pro Tag (nur Tage mit Nutzung)</span>
                    </div>
                    <div class="stat-card">
                        <strong>{{ number_format($avgSessionsPerWeek ?? 0, 1, ',', '.') }}</strong>
                        <span>Ø App-Öffnungen pro Woche</span>
                    </div>
                    <div class="stat-card">
                        <strong>{{ number_format($userSessionsTotal ?? 0, 0, ',', '.') }}</strong>
                        <span>Session-Starts im Zeitraum</span>
                    </div>
                </div>
            </div>
        @endif

        @if($total == 0 && (!isset($pageViewsTotal) || $pageViewsTotal == 0) && (!isset($userSessionsTotal) || $userSessionsTotal == 0) && (!isset($symptomMostUsed) || $symptomMostUsed->count() == 0))
            <div class="empty">
                <p style="font-size: 18px; margin-bottom: 10px;">📭 Keine Daten verfügbar</p>
                <p style="color: #999;">Für den ausgewählten Zeitraum wurden noch keine Nutzungsdaten erfasst.</p>
            </div>
        @endif
    </div>
</body>
</html>

