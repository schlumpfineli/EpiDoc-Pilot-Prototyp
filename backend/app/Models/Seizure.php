<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Seizure extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'date',
        'type',
        'custom_type',
        'felt_before',
        'felt_symptoms',
        'seizure_count',
        'duration_minutes',
        'duration_seconds',
        'after_effects',
        'custom_after_effects',
        'triggers',
        'custom_triggers',
        'emergency_med',
        'emergency_med_name',
        'video_path',
    ];

    protected $casts = [
        'date' => 'date',
        'type' => 'array',
        'after_effects' => 'array',
        'triggers' => 'array',
        'seizure_count' => 'integer',
        'duration_minutes' => 'integer',
        'duration_seconds' => 'integer',
        'emergency_med' => 'boolean',
    ];

    /**
     * Get the user that owns the seizure entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
