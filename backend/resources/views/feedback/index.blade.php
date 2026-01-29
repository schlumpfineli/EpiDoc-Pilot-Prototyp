<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EpiDoc - Feedback-Meldungen</title>
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
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #2563eb;
            margin-bottom: 10px;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        .stat-card {
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-card strong {
            display: block;
            font-size: 24px;
            color: #2563eb;
        }
        .stat-card span {
            font-size: 14px;
            color: #666;
        }
        .filters {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .filters a {
            display: inline-block;
            padding: 8px 16px;
            margin-right: 10px;
            background: #e5e7eb;
            color: #333;
            text-decoration: none;
            border-radius: 6px;
            transition: background 0.2s;
        }
        .filters a:hover, .filters a.active {
            background: #2563eb;
            color: white;
        }
        .feedback-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .feedback-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-left: 4px solid #2563eb;
        }
        .feedback-card.bug { border-left-color: #ef4444; }
        .feedback-card.improvement { border-left-color: #10b981; }
        .feedback-card.other { border-left-color: #6b7280; }
        .feedback-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 10px;
            flex-wrap: wrap;
            gap: 10px;
        }
        .feedback-type {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .type-bug { background: #fee2e2; color: #991b1b; }
        .type-improvement { background: #d1fae5; color: #065f46; }
        .type-other { background: #e5e7eb; color: #374151; }
        .feedback-meta {
            font-size: 14px;
            color: #666;
        }
        .feedback-message {
            margin: 15px 0;
            padding: 15px;
            background: #f9fafb;
            border-radius: 6px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .feedback-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #666;
            flex-wrap: wrap;
            gap: 10px;
        }
        .user-info {
            font-weight: 600;
            color: #333;
        }
        .pagination {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 30px;
        }
        .pagination a, .pagination span {
            padding: 8px 16px;
            background: white;
            border-radius: 6px;
            text-decoration: none;
            color: #333;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .pagination .active {
            background: #2563eb;
            color: white;
        }
        .empty {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
            <div>
                <h1>📝 EpiDoc - Feedback-Meldungen</h1>
                <p style="color: #666; margin-top: 5px;">Admin-Bereich - Übersicht über alle Feedback-Meldungen</p>
            </div>
            <a href="/admin/logout" style="padding: 10px 20px; background: #ef4444; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background 0.2s;">
                🚪 Abmelden
            </a>
        </div>


        <div class="stats">
            <div class="stat-card">
                <strong>{{ $totalCount }}</strong>
                <span>Gesamt</span>
            </div>
            <div class="stat-card">
                <strong style="color: #ef4444;">{{ $bugCount }}</strong>
                <span>Fehler</span>
            </div>
            <div class="stat-card">
                <strong style="color: #10b981;">{{ $improvementCount }}</strong>
                <span>Verbesserungen</span>
            </div>
            <div class="stat-card">
                <strong style="color: #6b7280;">{{ $otherCount }}</strong>
                <span>Sonstiges</span>
            </div>
        </div>

        <div class="filters">
            <strong style="margin-right: 15px;">Filter:</strong>
            <a href="?page={{ request('page', 1) }}" class="{{ !request('type') ? 'active' : '' }}">Alle</a>
            <a href="?type=bug&page={{ request('page', 1) }}" class="{{ request('type') == 'bug' ? 'active' : '' }}">Fehler</a>
            <a href="?type=improvement&page={{ request('page', 1) }}" class="{{ request('type') == 'improvement' ? 'active' : '' }}">Verbesserungen</a>
            <a href="?type=other&page={{ request('page', 1) }}" class="{{ request('type') == 'other' ? 'active' : '' }}">Sonstiges</a>
        </div>

        @if($feedback->count() > 0)
            <div class="feedback-list">
                @foreach($feedback as $item)
                    <div class="feedback-card {{ $item->type }}">
                        <div class="feedback-header">
                            <div>
                                <span class="feedback-type type-{{ $item->type }}">
                                    @if($item->type == 'bug') 🐛 Fehler
                                    @elseif($item->type == 'improvement') 💡 Verbesserung
                                    @else 📝 Sonstiges
                                    @endif
                                </span>
                            </div>
                            <div class="feedback-meta">
                                {{ $item->created_at->format('d.m.Y H:i') }}
                            </div>
                        </div>
                        <div class="feedback-message">{{ $item->message }}</div>
                        <div class="feedback-footer">
                            <div class="user-info">
                                👤 {{ $item->user->name }} ({{ $item->user->email }})
                            </div>
                            <div>
                                @if($item->page_url)
                                    🔗 <a href="{{ $item->page_url }}" target="_blank" style="color: #2563eb;">Seite anzeigen</a>
                                @endif
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>

            @if($feedback->hasPages())
                <div class="pagination">
                    @if($feedback->onFirstPage())
                        <span>&laquo; Zurück</span>
                    @else
                        <a href="{{ $feedback->previousPageUrl() }}&type={{ request('type', '') }}">&laquo; Zurück</a>
                    @endif

                    @foreach($feedback->getUrlRange(1, $feedback->lastPage()) as $page => $url)
                        @if($page == $feedback->currentPage())
                            <span class="active">{{ $page }}</span>
                        @else
                            <a href="{{ $url }}&type={{ request('type', '') }}">{{ $page }}</a>
                        @endif
                    @endforeach

                    @if($feedback->hasMorePages())
                        <a href="{{ $feedback->nextPageUrl() }}&type={{ request('type', '') }}">Weiter &raquo;</a>
                    @else
                        <span>Weiter &raquo;</span>
                    @endif
                </div>
            @endif
        @else
            <div class="empty">
                <p style="font-size: 18px; margin-bottom: 10px;">📭 Keine Feedback-Meldungen gefunden</p>
                <p style="color: #999;">Es wurden noch keine Feedback-Meldungen gesendet.</p>
            </div>
        @endif
    </div>
</body>
</html>

