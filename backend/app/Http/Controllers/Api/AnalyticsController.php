<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UsageLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AnalyticsController extends Controller
{
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
            ->select('function_name', DB::raw('COUNT(*) as count'))
            ->groupBy('function_name')
            ->orderByDesc('count')
            ->get();

        $total = UsageLog::whereBetween('date', [$startDate, $endDate])
            ->whereNotNull('function_name')
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
            ->select('function_name', DB::raw('COUNT(*) as count'))
            ->groupBy('function_name')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        $leastUsedFunctions = UsageLog::whereBetween('date', [$startDate, $endDate])
            ->whereNotNull('function_name')
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
                    ->select('function_name', DB::raw('COUNT(*) as count'))
                    ->groupBy('function_name')
                    ->orderByDesc('count')
                    ->get();

                // Wenig genutzte Funktionen
                $leastUsedFunctions = UsageLog::whereBetween('date', [$startDate, $endDate])
                    ->whereNotNull('function_name')
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

        return view('admin.analytics', compact(
            'startDate',
            'endDate',
            'total',
            'errors',
            'topFunctions',
            'leastUsedFunctions',
            'dailyStats',
            'tableExists'
        ));
    }
}

