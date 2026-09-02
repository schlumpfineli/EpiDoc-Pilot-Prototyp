<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    /**
     * Creates the application.
     *
     * @return \Illuminate\Foundation\Application
     */
    public function createApplication()
    {
        $app = require __DIR__.'/../bootstrap/app.php';

        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

        return $app;
    }

    /**
     * Gültige Registrierungsdaten inkl. Einwilligungen.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function registerPayload(array $overrides = []): array
    {
        return array_merge([
            'email' => 'test@example.com',
            'role' => 'patient',
            'password' => 'Password123',
            'privacy_accepted' => true,
            'health_data_consent' => true,
        ], $overrides);
    }

    /**
     * Helper: Create and authenticate a user.
     *
     * @param array $attributes
     * @return \App\Models\User
     */
    protected function createAuthenticatedUser(array $attributes = []): \App\Models\User
    {
        $user = \App\Models\User::factory()->create($attributes);
        $token = $user->createToken('test-token')->plainTextToken;
        $this->withHeader('Authorization', 'Bearer ' . $token);
        return $user;
    }
}
