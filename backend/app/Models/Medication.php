<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medication extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'dose',
        'frequency',
        'time_of_day',
        'notes',
        'prescribed_since',
        'active',
        'discontinued_at',
        'discontinuation_reason',
    ];

    protected function casts(): array
    {
        return [
            'time_of_day' => 'array',
            'active' => 'boolean',
            'prescribed_since' => 'date',
            'discontinued_at' => 'date',
        ];
    }

    /**
     * Get the user that owns the medication.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
