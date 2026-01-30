<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\BefindenController;
use App\Http\Controllers\Api\SeizureController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\FeedbackController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/password/forgot', [AuthController::class, 'forgotPassword']);
Route::post('/password/reset', [AuthController::class, 'resetPassword']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // User routes (Pilot: ohne Klartext-Name, nur display_name = User-ID)
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
        $data = $user->only([
            'id', 'email', 'role', 'disease',
            'doctors', 'clinics', 'pharmacies', 'emergency_contact',
            'created_at', 'updated_at'
        ]);
        $data['display_name'] = $user->display_name;
        return response()->json(['user' => $data]);
    });

    // Befinden routes
    Route::apiResource('befinden', BefindenController::class);

    // Seizure routes
    Route::apiResource('seizures', SeizureController::class);

    // User profile routes
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::put('/user/password', [AuthController::class, 'changePassword']);
    Route::delete('/user', [AuthController::class, 'deleteAccount']);

    // Feedback routes
    Route::post('/feedback', [FeedbackController::class, 'store']);

    // Session & Analytics Tracking (Nutzungsstatistik)
    Route::post('/session/start', [SessionController::class, 'start']);
    Route::post('/session/end', [SessionController::class, 'end']);
    Route::post('/session/page-view', [SessionController::class, 'pageView']);
});

// Admin Analytics routes (protected by AdminAuth via web routes)
// Diese Routen sind über Web-Interface verfügbar unter /admin/analytics

