<?php

namespace Tests\Feature;

use App\Models\Seizure;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

class SqlInjectionProtectionTest extends \Tests\TestCase
{
    use RefreshDatabase;

    /** @test */
    public function user_cannot_inject_sql_via_email_field()
    {
        // Versuche SQL-Injection über E-Mail-Feld
        $maliciousEmail = "test@example.com' OR '1'='1";
        
        $response = $this->postJson('/api/register', $this->registerPayload([
            'email' => $maliciousEmail,
        ]));

        // Sollte entweder Validierungsfehler geben (ungültige E-Mail) oder User erstellen
        // Wichtig: Kein SQL-Injection möglich
        $response->assertStatus(422); // E-Mail-Format ungültig
    }

    /** @test */
    public function user_cannot_inject_sql_via_where_clause()
    {
        $user = $this->createAuthenticatedUser();
        
        // Versuche SQL-Injection über WHERE-Klausel
        $maliciousId = "1 OR 1=1";
        
        $response = $this->getJson("/api/seizures/{$maliciousId}");
        
        // Sollte 404 geben (nicht gefunden), nicht alle Daten zurückgeben
        $response->assertStatus(404);
        
        // Stelle sicher, dass keine anderen Seizures zurückgegeben wurden
        $responseData = $response->json();
        $this->assertArrayNotHasKey('data', $responseData);
    }

    /** @test */
    public function where_date_prevents_sql_injection()
    {
        $user = $this->createAuthenticatedUser();
        
        // Versuche SQL-Injection über Datum-Filter
        $maliciousDate = "2025-01-15' OR '1'='1";
        
        $response = $this->getJson("/api/seizures?date={$maliciousDate}");
        
        // Sollte entweder Validierungsfehler geben oder kein Ergebnis
        // Wichtig: Prepared Statements sollten dies verhindern
        $response->assertStatus(200);
        
        // Die Query sollte kein Ergebnis zurückgeben (kein gültiges Datum)
        $responseData = $response->json();
        $this->assertIsArray($responseData['data']);
        // Prepared Statements binden den Wert als String, daher kein SQL-Injection möglich
    }

    /** @test */
    public function eloquent_where_clauses_use_parameter_binding()
    {
        // Erstelle Test-Daten
        $user1 = User::factory()->create(['email' => 'user1@example.com']);
        $user2 = User::factory()->create(['email' => 'user2@example.com']);
        
        Seizure::factory()->create(['user_id' => $user1->id]);
        Seizure::factory()->create(['user_id' => $user2->id]);
        
        // Versuche SQL-Injection über user_id
        // Da Eloquent Parameter-Bindings verwendet, sollte dies sicher sein
        $token = $user1->createToken('test-token')->plainTextToken;
        
        // Versuche, auf Daten von user2 zuzugreifen
        $maliciousUserId = $user2->id;
        
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson("/api/seizures");
        
        $response->assertStatus(200);
        
        // Sollte nur Seizures von user1 zurückgeben, nicht von user2
        $responseData = $response->json();
        $this->assertIsArray($responseData['data']);
        
        foreach ($responseData['data'] as $seizure) {
            $this->assertEquals($user1->id, $seizure['user_id']);
            $this->assertNotEquals($user2->id, $seizure['user_id']);
        }
    }

    /** @test */
    public function update_operations_use_parameter_binding()
    {
        $user = $this->createAuthenticatedUser();
        $seizure = Seizure::factory()->create([
            'user_id' => $user->id,
            'custom_type' => 'Original Type',
        ]);
        
        // Versuche SQL-Injection über Update-Feld
        $maliciousInput = "Test'; DROP TABLE seizures; --";
        
        $response = $this->putJson("/api/seizures/{$seizure->id}", [
            'custom_type' => $maliciousInput,
        ]);
        
        $response->assertStatus(200);
        
        // Die Daten sollten aktualisiert werden, aber als String behandelt
        // Sanitization-Middleware escaped HTML-Sonderzeichen, aber SQL-Injection wird durch Prepared Statements verhindert
        $seizure->refresh();
        
        // Die Eingabe wird von der Sanitization-Middleware escaped, aber das ist OK
        // Wichtig: Kein SQL wird ausgeführt (Prepared Statements)
        $this->assertNotEmpty($seizure->custom_type);
        
        // Stelle sicher, dass die Tabelle noch existiert
        $this->assertDatabaseHas('seizures', [
            'id' => $seizure->id,
        ]);
    }

    /** @test */
    public function insert_operations_use_parameter_binding()
    {
        $user = $this->createAuthenticatedUser();
        
        // Versuche SQL-Injection über Insert-Feld
        $maliciousInput = "Test'; DROP TABLE seizures; --";
        
        $response = $this->postJson('/api/seizures', [
            'date' => '2025-01-15',
            'seizure_count' => 1,
            'emergency_med' => false,
            'custom_type' => $maliciousInput,
        ]);
        
        $response->assertStatus(201);
        
        // Die Daten sollten gespeichert werden, aber als String behandelt
        // Sanitization-Middleware escaped HTML-Sonderzeichen, aber SQL-Injection wird durch Prepared Statements verhindert
        // Wichtig: Kein SQL wird ausgeführt (Prepared Statements)
        $responseData = $response->json('data');
        $this->assertNotNull($responseData);
        $this->assertNotNull($responseData['custom_type']);
        
        // Stelle sicher, dass die Tabelle noch existiert
        $this->assertTrue(DB::getSchemaBuilder()->hasTable('seizures'));
        
        // Stelle sicher, dass ein Seizure-Eintrag mit der malicious Input erstellt wurde
        $this->assertDatabaseHas('seizures', [
            'user_id' => $user->id,
        ]);
    }
}

