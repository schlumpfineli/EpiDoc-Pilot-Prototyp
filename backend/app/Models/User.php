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
        'disease',
        'doctors',
        'clinics',
        'pharmacies',
        'emergency_contact',
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
            'doctors' => 'array',
            'clinics' => 'array',
            'pharmacies' => 'array',
            'emergency_contact' => 'array',
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

}
