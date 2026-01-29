<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\BefindenController;
use App\Http\Controllers\Api\SeizureController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\FeedbackController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // User routes
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return response()->json([
            'user' => $request->user()->only([
                'id', 'name', 'email', 'role', 'disease',
                'doctors', 'clinics', 'pharmacies', 'emergency_contact',
                'created_at', 'updated_at'
            ]),
        ]);
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
});

// Admin Analytics routes (protected by AdminAuth via web routes)
// Diese Routen sind über Web-Interface verfügbar unter /admin/analytics

