<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PageView;
use App\Models\UserSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    /**
     * Start einer App-Session (für Nutzungsstatistik).
     */
    public function start(Request $request): JsonResponse
    {
        $user = $request->user();

        $session = UserSession::create([
            'user_id' => $user->id,
            'started_at' => now(),
        ]);

        return response()->json([
            'message' => 'Session gestartet',
            'session_id' => $session->id,
        ]);
    }

    /**
     * Ende einer App-Session (Tab schließen, App wegdücken, Logout).
     * Akzeptiert optional session_id und duration_seconds (z. B. von Beacon beim Schließen).
     */
    public function end(Request $request): JsonResponse
    {
        $user = $request->user();

        $sessionId = $request->input('session_id');
        $durationSeconds = $request->input('duration_seconds');

        $session = null;
        if ($sessionId) {
            $session = UserSession::where('user_id', $user->id)
                ->where('id', $sessionId)
                ->whereNull('ended_at')
                ->first();
        }
        if (!$session) {
            $session = UserSession::where('user_id', $user->id)
                ->whereNull('ended_at')
                ->orderByDesc('started_at')
                ->first();
        }

        if ($session) {
            $session->ended_at = now();
            if ($durationSeconds !== null && $durationSeconds !== '') {
                $session->duration_seconds = (int) $durationSeconds;
            } else {
                $session->duration_seconds = (int) $session->started_at->diffInSeconds($session->ended_at);
            }
            $session->save();
        }

        return response()->json([
            'message' => 'Session beendet',
        ]);
    }

    /**
     * Seitenaufruf protokollieren (für Admin-Statistik).
     */
    public function pageView(Request $request): JsonResponse
    {
        $request->validate([
            'path' => 'required|string|max:500',
        ]);

        $user = $request->user();

        PageView::create([
            'user_id' => $user->id,
            'path' => $request->input('path'),
            'date' => now()->toDateString(),
        ]);

        return response()->json(['message' => 'OK']);
    }
}
