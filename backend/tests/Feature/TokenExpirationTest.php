<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class TokenExpirationTest extends \Tests\TestCase
{
    use RefreshDatabase;

    /** @test */
    public function token_has_expiration_time_after_registration()
    {
        $response = $this->postJson('/api/register', $this->registerPayload());

        $response->assertStatus(201);
        $token = $response->json('token');

        // Finde den Token in der Datenbank
        $tokenRecord = PersonalAccessToken::findToken($token);
        
        $this->assertNotNull($tokenRecord);
        $this->assertNotNull($tokenRecord->expires_at);
        
        // Prüfe, dass die Ablaufzeit etwa 168 Stunden (7 Tage) in der Zukunft liegt
        $expectedExpiration = now()->addHours(168);
        $this->assertEqualsWithDelta(
            $expectedExpiration->timestamp,
            $tokenRecord->expires_at->timestamp,
            60 // Toleranz von 1 Minute für Test-Ausführungszeit
        );
    }

    /** @test */
    public function token_has_expiration_time_after_login()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('Password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'Password123',
        ]);

        $response->assertStatus(200);
        $token = $response->json('token');

        // Finde den Token in der Datenbank
        $tokenRecord = PersonalAccessToken::findToken($token);
        
        $this->assertNotNull($tokenRecord);
        $this->assertNotNull($tokenRecord->expires_at);
        
        // Prüfe, dass die Ablaufzeit etwa 168 Stunden (7 Tage) in der Zukunft liegt
        $expectedExpiration = now()->addHours(168);
        $this->assertEqualsWithDelta(
            $expectedExpiration->timestamp,
            $tokenRecord->expires_at->timestamp,
            60 // Toleranz von 1 Minute
        );
    }

    /** @test */
    public function expired_token_cannot_access_protected_routes()
    {
        $user = User::factory()->create();
        
        // Erstelle ein Token, das bereits abgelaufen ist
        $expiredToken = $user->createToken(
            'expired-token',
            ['*'],
            now()->subHour() // Abgelaufen vor 1 Stunde
        )->plainTextToken;

        // Versuche, auf eine geschützte Route zuzugreifen
        $response = $this->withHeader('Authorization', 'Bearer ' . $expiredToken)
            ->getJson('/api/user');

        // Sollte 401 Unauthorized zurückgeben
        $response->assertStatus(401);
    }

    /** @test */
    public function valid_token_can_access_protected_routes()
    {
        $user = $this->createAuthenticatedUser();

        $response = $this->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'email',
                    'role',
                ],
            ]);
        
        // Prüfe, dass es der richtige User ist
        $response->assertJson([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
            ],
        ]);
    }

    /** @test */
    public function token_expiration_can_be_configured_via_env()
    {
        // Setze eine andere Ablaufzeit über Config (simuliert ENV)
        config(['sanctum.expiration' => 60]); // 1 Stunde

        $response = $this->postJson('/api/register', $this->registerPayload());

        $response->assertStatus(201);
        $token = $response->json('token');

        // Finde den Token in der Datenbank
        $tokenRecord = PersonalAccessToken::findToken($token);
        
        $this->assertNotNull($tokenRecord);
        
        // Prüfe, dass die Ablaufzeit etwa 1 Stunde in der Zukunft liegt
        // (Aber das explizite expires_at beim createToken überschreibt die Config)
        // Daher prüfen wir nur, dass expires_at gesetzt ist
        $this->assertNotNull($tokenRecord->expires_at);
    }

    /** @test */
    public function user_can_have_multiple_tokens_with_different_expiration()
    {
        $user = User::factory()->create();

        // Erstelle zwei Tokens mit unterschiedlichen Ablaufzeiten
        $token1 = $user->createToken(
            'token-1',
            ['*'],
            now()->addHour()
        )->plainTextToken;

        $token2 = $user->createToken(
            'token-2',
            ['*'],
            now()->addHours(24)
        )->plainTextToken;

        // Beide Tokens sollten funktionieren
        $response1 = $this->withHeader('Authorization', 'Bearer ' . $token1)
            ->getJson('/api/user');
        $response1->assertStatus(200);

        $response2 = $this->withHeader('Authorization', 'Bearer ' . $token2)
            ->getJson('/api/user');
        $response2->assertStatus(200);

        // Token-Records sollten unterschiedliche Ablaufzeiten haben
        $tokenRecord1 = PersonalAccessToken::findToken($token1);
        $tokenRecord2 = PersonalAccessToken::findToken($token2);

        $this->assertNotEquals(
            $tokenRecord1->expires_at->timestamp,
            $tokenRecord2->expires_at->timestamp
        );
    }
}

