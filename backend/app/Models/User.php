<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'role',
        'password',
        'phone',
        'address',
        'disease',
        'diagnoses',
        'doctors',
        'clinics',
        'pharmacies',
        'emergency_contact',
        'privacy_accepted_at',
        'health_data_consent_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'diagnoses' => 'array',
            'doctors' => 'array',
            'clinics' => 'array',
            'pharmacies' => 'array',
            'emergency_contact' => 'array',
            'privacy_accepted_at' => 'datetime',
            'health_data_consent_at' => 'datetime',
        ];
    }

    /**
     * Get the befinden entries for the user.
     */
    public function befindens()
    {
        return $this->hasMany(Befinden::class);
    }

    /**
     * Get the seizures for the user.
     */
    public function seizures()
    {
        return $this->hasMany(Seizure::class);
    }

    /**
     * Get the user's own after-effect/trigger options for the seizure diary.
     */
    public function seizureCustomOptions()
    {
        return $this->hasMany(SeizureCustomOption::class);
    }

    /**
     * Get the medications for the user.
     */
    public function medications()
    {
        return $this->hasMany(Medication::class);
    }

    /**
     * Get the free-form journal entries for the user.
     */
    public function journalEntries()
    {
        return $this->hasMany(JournalEntry::class);
    }

    /**
     * Get the push subscriptions for the user.
     */
    public function pushSubscriptions()
    {
        return $this->hasMany(PushSubscription::class);
    }

    /**
     * Get the page views for the user.
     */
    public function pageViews()
    {
        return $this->hasMany(PageView::class);
    }

    /**
     * Get the user sessions for the user.
     */
    public function userSessions()
    {
        return $this->hasMany(UserSession::class);
    }

    /**
     * Pilot: Anzeigename nur als User-ID (kein Klartext-Name).
     */
    public function getDisplayNameAttribute(): string
    {
        return 'User-' . $this->id;
    }

    /**
     * Pilot: Reset-Link auf Frontend-URL senden.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new \App\Notifications\ResetPasswordNotification($token));
    }
}
