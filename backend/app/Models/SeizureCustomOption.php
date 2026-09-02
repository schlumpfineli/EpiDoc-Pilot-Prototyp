<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Selbst eingetragene Auffälligkeiten und Auslöser, die in der Auswahlliste
 * des Anfallstagebuchs oben erscheinen.
 */
class SeizureCustomOption extends Model
{
    use HasFactory;

    public const KIND_AFTER_EFFECT = 'after_effect';
    public const KIND_TRIGGER = 'trigger';

    public const KINDS = [
        self::KIND_AFTER_EFFECT,
        self::KIND_TRIGGER,
    ];

    protected $fillable = [
        'user_id',
        'kind',
        'label',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
