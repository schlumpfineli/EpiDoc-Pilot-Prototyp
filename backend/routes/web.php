<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\AdminMigrationController;
use App\Http\Middleware\AdminAuth;

Route::get('/feedback', [FeedbackController::class, 'view'])
    ->middleware([AdminAuth::class])
    ->name('feedback.view');

Route::get('/admin/logout', function () {
    session()->forget('admin_authenticated');
    return redirect('/feedback')->with('success', 'Erfolgreich abgemeldet');
})->name('admin.logout');

// Admin Analytics Routes
// POST wird für Login benötigt, GET für die View
Route::match(['GET', 'POST'], '/admin/analytics', [AnalyticsController::class, 'view'])
    ->middleware([AdminAuth::class])
    ->name('admin.analytics.view');

Route::prefix('admin/analytics')->middleware([AdminAuth::class])->group(function () {
    Route::get('/api/summary', [AnalyticsController::class, 'summary'])->name('admin.analytics.api.summary');
    Route::get('/api/function-usage', [AnalyticsController::class, 'functionUsage'])->name('admin.analytics.api.functionUsage');
    Route::get('/api/endpoint-stats', [AnalyticsController::class, 'endpointStats'])->name('admin.analytics.api.endpointStats');
    Route::get('/api/daily-stats', [AnalyticsController::class, 'dailyStats'])->name('admin.analytics.api.dailyStats');
    Route::get('/api/status-stats', [AnalyticsController::class, 'statusStats'])->name('admin.analytics.api.statusStats');
    Route::get('/api/befinden-symptoms', [AnalyticsController::class, 'befindenSymptoms'])->name('admin.analytics.api.befindenSymptoms');
    Route::get('/api/page-views', [AnalyticsController::class, 'pageViews'])->name('admin.analytics.api.pageViews');
    Route::get('/api/user-sessions', [AnalyticsController::class, 'userSessions'])->name('admin.analytics.api.userSessions');
});

// TEMPORÄR: Admin Migration Routes (nur für Pilot-Phase, danach entfernen!)
Route::match(['GET', 'POST'], '/admin/migrate', [AdminMigrationController::class, 'index'])
    ->middleware([AdminAuth::class])
    ->name('admin.migrate.index');
Route::post('/admin/migrate/run', [AdminMigrationController::class, 'run'])
    ->middleware([AdminAuth::class])
    ->name('admin.migrate.run');
