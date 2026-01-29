<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UsageLog extends Model
{
    protected $fillable = [
        'endpoint',
        'method',
        'status_code',
        'function_name',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }
}
