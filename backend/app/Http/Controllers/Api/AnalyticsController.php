<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Befinden;
use App\Models\CustomSymptomLabel;
use App\Models\PageView;
use App\Models\UsageLog;
use App\Models\User;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AnalyticsController extends Controller
{
    /** Funktionen, die nicht mehr zur App gehören (z. B. entfernte Features), in der Anzeige ausblenden. */
    private const EXCLUDED_FUNCTION_NAMES = [];

    /**
     * Beschwerden/Symptome: häufigste und nie genutzte (Befinden).
     */
    public function befindenSymptoms(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());
        $knownIds = config('befinden.known_symptom_ids', []);

        $used = Befinden::whereBetween('date', [$startDate, $endDate])
            ->select('symptom_id', DB::raw('COUNT(*) as count'))
            ->groupBy('symptom_id')
            ->orderByDesc('count')
            ->get();

        $usedIds = $used->pluck('symptom_id')->unique()->values()->all();
        $neverUsed = array_values(array_diff($knownIds, $usedIds));

        $symptomLabels = config('befinden.symptom_labels', []);

        return response()->json([
            'period' => ['start_date' => $startDate, 'end_date' => $endDate],
            'most_used' => $used->map(fn ($row) => [
                'symptom_id' => $row->symptom_id,
                'label' => $symptomLabels[$row->symptom_id] ?? $row->symptom_id,
                'count' => $row->count,
            ]),
            'never_used' => array_map(fn ($id) => [
                'symptom_id' => $id,
                'label' => $symptomLabels[$id] ?? $id,
            ], $neverUsed),
        ]);
    }

    /**
     * Seitenaufrufe: welche Seiten wie oft.
     */
    public function pageViews(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        if (!Schema::hasTable('page_views')) {
            return response()->json([
                'period' => ['start_date' => $startDate, 'end_date' => $endDate],
                'by_path' => [],
                'total' => 0,
            ]);
        }

        $byPath = PageView::whereBetween('date', [$startDate, $endDate])
            ->select('path', DB::raw('COUNT(*) as count'))
            ->groupBy('path')
            ->orderByDesc('count')
            ->get();

        $total = PageView::whereBetween('date', [$startDate, $endDate])->count();

        return response()->json([
            'period' => ['start_date' => $startDate, 'end_date' => $endDate],
            'by_path' => $byPath,
            'total' => $total,
        ]);
    }

    /**
     * Nutzungszeit: Ø Minuten pro Tag, Ø App-Öffnungen pro Woche (anonymisiert).
     */
    public function userSessions(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        if (!Schema::hasTable('user_sessions')) {
            return response()->json([
                'period' => ['start_date' => $startDate, 'end_date' => $endDate],
                'avg_minutes_per_day' => 0,
                'avg_sessions_per_week' => 0,
                'total_sessions' => 0,
            ]);
        }

        $sessions = UserSession::whereBetween('started_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->get();

        $totalSessions = $sessions->count();
        $sessionsWithDuration = $sessions->filter(fn ($s) => $s->duration_seconds !== null || $s->ended_at !== null);
        $totalMinutes = $sessionsWithDuration->sum(function ($s) {
            if ($s->duration_seconds !== null) {
                return $s->duration_seconds / 60;
            }
            if ($s->ended_at) {
                return $s->started_at->diffInSeconds($s->ended_at) / 60;
            }
            return 0;
        });

        $daysWithSessions = $sessions->groupBy(fn ($s) => $s->started_at->toDateString())->count();
        $avgMinutesPerDay = $daysWithSessions > 0 ? round($totalMinutes / $daysWithSessions, 1) : 0;

        $weeks = max(1, (int) ceil((strtotime($endDate) - strtotime($startDate)) / (7 * 86400)));
        $avgSessionsPerWeek = round($totalSessions / $weeks, 1);

        return response()->json([
            'period' => ['start_date' => $startDate, 'end_date' => $endDate],
            'avg_minutes_per_day' => $avgMinutesPerDay,
            'avg_sessions_per_week' => $avgSessionsPerWeek,
            'total_sessions' => $totalSessions,
            'total_minutes' => round($totalMinutes, 1),
            'days_with_sessions' => $daysWithSessions,
        ]);
    }

    /**
     * Übersicht über Funktionsnutzung (anonymisiert)
     * Zeigt welche Funktionen wie oft genutzt werden
     */
    public function functionUsage(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        $stats = UsageLog::whereBetween('date', [$startDate, $endDate])
            ->whereNotNull('function_name')
            ->whereNotIn('function_name', self::EXCLUDED_FUNCTION_NAMES)
            ->select('function_name', DB::raw('COUNT(*) as count'))
            ->groupBy('function_name')
            ->orderByDesc('count')
            ->get();

        $total = UsageLog::whereBetween('date', [$startDate, $endDate])
            ->whereNotNull('function_name')
            ->whereNotIn('function_name', self::EXCLUDED_FUNCTION_NAMES)
            ->count();

        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'total_requests' => $total,
            'function_usage' => $stats->map(function ($stat) use ($total) {
                return [
                    'function' => $stat->function_name,
                    'count' => $stat->count,
                    'percentage' => $total > 0 ? round(($stat->count / $total) * 100, 2) : 0,
                ];
            }),
        ]);
    }

    /**
     * Detaillierte Endpunkt-Statistiken
     */
    public function endpointStats(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        $stats = UsageLog::whereBetween('date', [$startDate, $endDate])
            ->select('endpoint', 'method', DB::raw('COUNT(*) as count'))
            ->groupBy('endpoint', 'method')
            ->orderByDesc('count')
            ->get();

        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'endpoints' => $stats,
        ]);
    }

    /**
     * Tägliche Nutzungsstatistiken
     */
    public function dailyStats(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        $stats = UsageLog::whereBetween('date', [$startDate, $endDate])
            ->select('date', DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'daily_stats' => $stats,
        ]);
    }

    /**
     * Status-Code-Statistiken (Fehlerrate)
     */
    public function statusStats(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        $stats = UsageLog::whereBetween('date', [$startDate, $endDate])
            ->select('status_code', DB::raw('COUNT(*) as count'))
            ->groupBy('status_code')
            ->orderByDesc('count')
            ->get();

        $total = UsageLog::whereBetween('date', [$startDate, $endDate])->count();
        $errors = UsageLog::whereBetween('date', [$startDate, $endDate])
            ->where('status_code', '>=', 400)
            ->count();

        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'total_requests' => $total,
            'error_count' => $errors,
            'error_rate' => $total > 0 ? round(($errors / $total) * 100, 2) : 0,
            'status_codes' => $stats,
        ]);
    }

    /**
     * Zusammenfassung aller Statistiken
     */
    public function summary(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        $total = UsageLog::whereBetween('date', [$startDate, $endDate])->count();
        $errors = UsageLog::whereBetween('date', [$startDate, $endDate])
            ->where('status_code', '>=', 400)
            ->count();

        $topFunctions = UsageLog::whereBetween('date', [$startDate, $endDate])
            ->whereNotNull('function_name')
            ->whereNotIn('function_name', self::EXCLUDED_FUNCTION_NAMES)
            ->select('function_name', DB::raw('COUNT(*) as count'))
            ->groupBy('function_name')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        $leastUsedFunctions = UsageLog::whereBetween('date', [$startDate, $endDate])
            ->whereNotNull('function_name')
            ->whereNotIn('function_name', self::EXCLUDED_FUNCTION_NAMES)
            ->select('function_name', DB::raw('COUNT(*) as count'))
            ->groupBy('function_name')
            ->orderBy('count')
            ->limit(5)
            ->get();

        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'summary' => [
                'total_requests' => $total,
                'error_count' => $errors,
                'error_rate' => $total > 0 ? round(($errors / $total) * 100, 2) : 0,
            ],
            'top_functions' => $topFunctions->map(fn($f) => [
                'function' => $f->function_name,
                'count' => $f->count,
            ]),
            'least_used_functions' => $leastUsedFunctions->map(fn($f) => [
                'function' => $f->function_name,
                'count' => $f->count,
            ]),
        ]);
    }

    /**
     * HTML-View für Analytics-Dashboard
     * Protected by AdminAuth middleware
     */
    public function view(Request $request): \Illuminate\Contracts\View\View
    {
        $startDate = $request->get('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());

        // Prüfe, ob die Tabelle existiert
        $tableExists = false;
        try {
            $tableExists = Schema::hasTable('usage_logs');
        } catch (\Exception $e) {
            // Tabelle existiert nicht oder Fehler beim Prüfen
        }

        // Initialisiere Variablen mit Standardwerten
        $total = 0;
        $errors = 0;
        $topFunctions = collect();
        $leastUsedFunctions = collect();
        $dailyStats = collect();
        $symptomMostUsed = collect();
        $symptomNeverUsed = collect();
        $customSymptomsList = collect();
        $pageViewsByPath = collect();
        $pageViewsTotal = 0;
        $avgMinutesPerDay = 0;
        $avgSessionsPerWeek = 0;
        $userSessionsTotal = 0;
        $pageViewsTableExists = false;
        $userSessionsTableExists = false;
        $usersPatient = 0;
        $usersRelative = 0;

        // Registrierungen nach Rolle (Patient / Angehöriger) – anonym, nur Anzahlen
        try {
            if (Schema::hasTable('users')) {
                $usersPatient = User::where('role', 'patient')->count();
                $usersRelative = User::where('role', 'relative')->count();
            }
        } catch (\Exception $e) {
        }

        // Nur abfragen, wenn Tabelle existiert
        if ($tableExists) {
            try {
                // Zusammenfassung
                $total = UsageLog::whereBetween('date', [$startDate, $endDate])->count();
                $errors = UsageLog::whereBetween('date', [$startDate, $endDate])
                    ->where('status_code', '>=', 400)
                    ->count();

                // Top Funktionen
                $topFunctions = UsageLog::whereBetween('date', [$startDate, $endDate])
                    ->whereNotNull('function_name')
                    ->whereNotIn('function_name', self::EXCLUDED_FUNCTION_NAMES)
                    ->select('function_name', DB::raw('COUNT(*) as count'))
                    ->groupBy('function_name')
                    ->orderByDesc('count')
                    ->get();

                // Wenig genutzte Funktionen
                $leastUsedFunctions = UsageLog::whereBetween('date', [$startDate, $endDate])
                    ->whereNotNull('function_name')
                    ->whereNotIn('function_name', self::EXCLUDED_FUNCTION_NAMES)
                    ->select('function_name', DB::raw('COUNT(*) as count'))
                    ->groupBy('function_name')
                    ->orderBy('count')
                    ->get();

                // Tägliche Statistiken
                $dailyStats = UsageLog::whereBetween('date', [$startDate, $endDate])
                    ->select('date', DB::raw('COUNT(*) as count'))
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get();
            } catch (\Exception $e) {
                // Fehler beim Abfragen - verwende Standardwerte
            }
        }

        // Befinden-Symptome (Beschwerden)
        try {
            if (Schema::hasTable('befindens')) {
                $used = Befinden::whereBetween('date', [$startDate, $endDate])
                    ->select('symptom_id', DB::raw('COUNT(*) as count'))
                    ->groupBy('symptom_id')
                    ->orderByDesc('count')
                    ->get();
                $usedIds = $used->pluck('symptom_id')->unique()->values()->all();
                $neverUsedIds = array_diff(config('befinden.known_symptom_ids', []), $usedIds);
                $labels = config('befinden.symptom_labels', []);
                $symptomMostUsed = $used->map(fn ($row) => (object) ['symptom_id' => $row->symptom_id, 'label' => $labels[$row->symptom_id] ?? $row->symptom_id, 'count' => $row->count]);
                $symptomNeverUsed = collect(array_map(fn ($id) => (object) ['symptom_id' => $id, 'label' => $labels[$id] ?? $id], $neverUsedIds));
            }
        } catch (\Exception $e) {
        }

        // Eigene Symptome (anonym): Labels + Nutzung im Zeitraum
        try {
            if (Schema::hasTable('custom_symptom_labels')) {
                $customLabels = CustomSymptomLabel::all();
                foreach ($customLabels as $c) {
                    $count = Befinden::where('symptom_id', $c->symptom_id)
                        ->whereBetween('date', [$startDate, $endDate])
                        ->count();
                    $customSymptomsList->push((object) ['label' => $c->label, 'count' => $count]);
                }
                $customSymptomsList = $customSymptomsList->sortByDesc('count')->values();
            }
        } catch (\Exception $e) {
        }

        // Seitenaufrufe
        try {
            $pageViewsTableExists = Schema::hasTable('page_views');
            if ($pageViewsTableExists) {
                $pageViewsByPath = PageView::whereBetween('date', [$startDate, $endDate])
                    ->select('path', DB::raw('COUNT(*) as count'))
                    ->groupBy('path')
                    ->orderByDesc('count')
                    ->get();
                $pageViewsTotal = PageView::whereBetween('date', [$startDate, $endDate])->count();
            }
        } catch (\Exception $e) {
        }

        // User-Sessions (Zeit in App)
        try {
            $userSessionsTableExists = Schema::hasTable('user_sessions');
            if ($userSessionsTableExists) {
                $sessions = UserSession::whereBetween('started_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])->get();
                $userSessionsTotal = $sessions->count();
                $totalMinutes = $sessions->filter(fn ($s) => $s->duration_seconds !== null || $s->ended_at !== null)->sum(function ($s) {
                    if ($s->duration_seconds !== null) return $s->duration_seconds / 60;
                    if ($s->ended_at) return $s->started_at->diffInSeconds($s->ended_at) / 60;
                    return 0;
                });
                $daysWithSessions = $sessions->groupBy(fn ($s) => $s->started_at->toDateString())->count();
                $avgMinutesPerDay = $daysWithSessions > 0 ? round($totalMinutes / $daysWithSessions, 1) : 0;
                $weeks = max(1, (int) ceil((strtotime($endDate) - strtotime($startDate)) / (7 * 86400)));
                $avgSessionsPerWeek = round($userSessionsTotal / $weeks, 1);
            }
        } catch (\Exception $e) {
        }

        return view('admin.analytics', compact(
            'startDate',
            'endDate',
            'total',
            'errors',
            'topFunctions',
            'leastUsedFunctions',
            'dailyStats',
            'tableExists',
            'symptomMostUsed',
            'symptomNeverUsed',
            'pageViewsByPath',
            'pageViewsTotal',
            'pageViewsTableExists',
            'avgMinutesPerDay',
            'avgSessionsPerWeek',
            'userSessionsTotal',
            'userSessionsTableExists',
            'customSymptomsList',
            'usersPatient',
            'usersRelative'
        ));
    }
}

