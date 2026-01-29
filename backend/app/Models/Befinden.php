<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Befinden extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'date',
        'category_id',
        'symptom_id',
        'time_of_day',
        'rating',
        'questions',
        'observation',
    ];

    protected $casts = [
        'date' => 'date',
        'rating' => 'integer',
        'questions' => 'array',
    ];

    /**
     * Get the user that owns the befinden entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
