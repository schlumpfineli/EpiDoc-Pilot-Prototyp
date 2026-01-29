<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Test-Benutzer für E2E-Tests (test@example.com / Password123)
        $testUser = User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'role' => 'patient',
                'password' => Hash::make('Password123'), // Starke Passwort-Anforderungen erfüllt
                'email_verified_at' => now(),
            ]
        );

        // Test Patient
        $patientUser = User::updateOrCreate(
            ['email' => 'patient@test.de'],
            [
                'name' => 'Test Patient',
                'role' => 'patient',
                'password' => Hash::make('Password123'), // Aktualisiert auf starkes Passwort
                'email_verified_at' => now(),
            ]
        );

        // Test Angehöriger
        $relativeUser = User::updateOrCreate(
            ['email' => 'angehoeriger@test.de'],
            [
                'name' => 'Test Angehöriger',
                'role' => 'relative',
                'password' => Hash::make('Password123'), // Aktualisiert auf starkes Passwort
                'email_verified_at' => now(),
            ]
        );

        // Demo-Daten generieren (nur wenn noch keine Daten vorhanden sind)
        $this->generateDemoData($testUser);
        $this->generateDemoData($patientUser);
    }

    /**
     * Generiert realistische Demo-Daten für einen Benutzer
     * WICHTIG: Nur für Test-User! Normale Registrierungen erhalten KEINE Demo-Daten.
     * 
     * Generiert 30 Tage Daten mit erkennbaren Mustern:
     * - Innere Unruhe steigt 2-4 Tage vor einem Anfall deutlich an
     * - 3-5 Anfälle im gesamten Zeitraum
     * - Tägliche Befinden-Einträge mit realistischen Schwankungen
     */
    private function generateDemoData(User $user): void
    {
        // Sicherheitsprüfung: Nur für Test-User Demo-Daten generieren
        $testUserEmails = ['test@example.com', 'patient@test.de', 'angehoeriger@test.de'];
        if (!in_array($user->email, $testUserEmails)) {
            // Keine Demo-Daten für normale Benutzer
            return;
        }

        // Prüfe, ob bereits Daten vorhanden sind
        $hasBefinden = \App\Models\Befinden::where('user_id', $user->id)->exists();
        $hasSeizures = \App\Models\Seizure::where('user_id', $user->id)->exists();

        // Generiere nur, wenn keine Daten vorhanden sind
        if (!$hasBefinden && !$hasSeizures) {
            // Schritt 1: Plane genau 4 Anfälle über 30 Tage verteilt
            $seizureCount = 4;
            $seizureDates = [];
            $days = range(0, 29);
            shuffle($days);
            
            // Verteile Anfälle gleichmäßig über den Zeitraum (mindestens 5 Tage Abstand)
            $selectedDays = [];
            $minDistance = 5;
            
            foreach ($days as $day) {
                $canAdd = true;
                foreach ($selectedDays as $selectedDay) {
                    if (abs($day - $selectedDay) < $minDistance) {
                        $canAdd = false;
                        break;
                    }
                }
                if ($canAdd && count($selectedDays) < $seizureCount) {
                    $selectedDays[] = $day;
                }
            }
            
            // Sortiere die Tage und erstelle Seizure-Einträge
            sort($selectedDays);
            foreach ($selectedDays as $day) {
                $date = now()->subDays(29 - $day);
                $seizureDates[] = $day;
                
                \App\Models\Seizure::factory()->create([
                    'user_id' => $user->id,
                    'date' => $date->format('Y-m-d'),
                    'seizure_count' => rand(1, 2),
                    'duration_minutes' => rand(1, 8),
                    'duration_seconds' => rand(0, 59),
                    'emergency_med' => rand(0, 3) === 0, // 25% Chance
                    'type' => ['focal', 'generalized'][rand(0, 1)],
                ]);
            }

            // Schritt 2: Generiere Befinden-Einträge mit exakten Anzahlen
            $timesOfDay = ['morning', 'noon', 'evening'];
            
            // Ziel: 
            // - Innere Unruhe: 30 Einträge (täglich, 1x pro Tag)
            // - Schlaf-Wach-Rhythmus: 45 Einträge (mehr als täglich, manchmal 2x pro Tag)
            // - Stress: 20 Einträge (nicht täglich)
            
            // Innere Unruhe: täglich, 1x pro Tag = 30 Einträge
            $restlessnessEntries = 0;
            $restlessnessTarget = 30;
            
            // Schlaf-Wach-Rhythmus: 45 Einträge (15 Tage mit 2 Einträgen, 15 Tage mit 1 Eintrag)
            $sleepRhythmEntries = 0;
            $sleepRhythmTarget = 45;
            $sleepRhythmDoubleDays = []; // Tage mit 2 Einträgen
            
            // Stress: 20 Einträge (nicht täglich)
            $stressEntries = 0;
            $stressTarget = 20;
            $stressDays = []; // Tage mit Stress-Einträgen
            
            // Plane Stress-Tage (20 von 30 Tagen)
            $allDays = range(0, 29);
            shuffle($allDays);
            $stressDays = array_slice($allDays, 0, 20);
            sort($stressDays);
            
            // Plane Schlaf-Wach-Rhythmus Doppel-Tage (15 Tage mit 2 Einträgen)
            $sleepDays = range(0, 29);
            shuffle($sleepDays);
            $sleepRhythmDoubleDays = array_slice($sleepDays, 0, 15);
            
            for ($day = 0; $day < 30; $day++) {
                $date = now()->subDays(29 - $day);
                
                // Bestimme, ob wir vor oder nach einem Anfall sind
                $daysBeforeSeizure = null;
                $daysAfterSeizure = null;
                foreach ($seizureDates as $seizureDay) {
                    if ($day < $seizureDay && ($daysBeforeSeizure === null || $seizureDay - $day < $daysBeforeSeizure)) {
                        $daysBeforeSeizure = $seizureDay - $day;
                    }
                    if ($day > $seizureDay && ($daysAfterSeizure === null || $day - $seizureDay < $daysAfterSeizure)) {
                        $daysAfterSeizure = $day - $seizureDay;
                    }
                }
                
                // Innere Unruhe: täglich, 1x pro Tag
                if ($restlessnessEntries < $restlessnessTarget) {
                    $timeOfDay = $timesOfDay[array_rand($timesOfDay)];
                    $baseRating = $this->calculateRating(
                        'restlessness',
                        $daysBeforeSeizure,
                        $daysAfterSeizure,
                        0,
                        $day
                    );
                    
                    \App\Models\Befinden::create([
                        'user_id' => $user->id,
                        'date' => $date->format('Y-m-d'),
                        'category_id' => 'mental',
                        'symptom_id' => 'restlessness',
                        'time_of_day' => $timeOfDay,
                        'rating' => $baseRating,
                    ]);
                    $restlessnessEntries++;
                }
                
                // Schlaf-Wach-Rhythmus: 45 Einträge
                if ($sleepRhythmEntries < $sleepRhythmTarget) {
                    $isDoubleDay = in_array($day, $sleepRhythmDoubleDays);
                    $timeCount = $isDoubleDay ? 2 : 1;
                    
                    $availableTimes = $timesOfDay;
                    shuffle($availableTimes);
                    $selectedTimes = array_slice($availableTimes, 0, $timeCount);
                    
                    foreach ($selectedTimes as $timeOfDay) {
                        if ($sleepRhythmEntries >= $sleepRhythmTarget) {
                            break;
                        }
                        
                        $baseRating = $this->calculateRating(
                            'sleep-rhythm',
                            $daysBeforeSeizure,
                            $daysAfterSeizure,
                            0,
                            $day
                        );
                        
                        \App\Models\Befinden::create([
                            'user_id' => $user->id,
                            'date' => $date->format('Y-m-d'),
                            'category_id' => 'lifestyle',
                            'symptom_id' => 'sleep-rhythm',
                            'time_of_day' => $timeOfDay,
                            'rating' => $baseRating,
                        ]);
                        $sleepRhythmEntries++;
                    }
                }
                
                // Stress: 20 Einträge (nur an bestimmten Tagen)
                if ($stressEntries < $stressTarget && in_array($day, $stressDays)) {
                    $timeOfDay = $timesOfDay[array_rand($timesOfDay)];
                    $baseRating = $this->calculateRating(
                        'stress',
                        $daysBeforeSeizure,
                        $daysAfterSeizure,
                        0,
                        $day
                    );
                    
                    \App\Models\Befinden::create([
                        'user_id' => $user->id,
                        'date' => $date->format('Y-m-d'),
                        'category_id' => 'mental',
                        'symptom_id' => 'stress',
                        'time_of_day' => $timeOfDay,
                        'rating' => $baseRating,
                    ]);
                    $stressEntries++;
                }
            }
        }
    }

    /**
     * Berechnet den Rating-Wert (1-10) basierend auf Symptom und Anfall-Nähe
     * 
     * Muster:
     * - Innere Unruhe: steigt ein paar Tage VOR dem Anfall an
     * - Schlaf-Wach-Rhythmus: ist schlechter NACH dem Anfall
     * - Stress: hat Schwankungen (kein klares Muster)
     */
    private function calculateRating(
        string $symptomId,
        ?int $daysBeforeSeizure,
        ?int $daysAfterSeizure,
        int $minDistanceToSeizure,
        int $currentDay
    ): int {
        // Grundniveau (niedrig bis mittel: 2-4)
        $baseRating = rand(2, 4);
        
        // Zufällige natürliche Schwankung (±1)
        $variation = rand(-1, 1);
        
        if ($symptomId === 'restlessness') {
            // Innere Unruhe: Steigt ein paar Tage VOR dem Anfall an
            if ($daysBeforeSeizure !== null && $daysBeforeSeizure <= 4 && $daysBeforeSeizure >= 2) {
                // 2-4 Tage vor Anfall: deutlicher Anstieg
                $baseRating = rand(6, 8);
            } elseif ($daysBeforeSeizure === 1) {
                // 1 Tag vor Anfall: kann hoch bleiben
                $baseRating = rand(6, 8);
            } elseif ($daysAfterSeizure === 0) {
                // Am Tag des Anfalls: kann noch erhöht sein
                $baseRating = rand(5, 7);
            } elseif ($daysAfterSeizure !== null && $daysAfterSeizure <= 2) {
                // 1-2 Tage nach Anfall: fällt wieder ab
                $baseRating = rand(3, 5);
            }
        } elseif ($symptomId === 'sleep-rhythm') {
            // Schlaf-Wach-Rhythmus: ist schlechter NACH dem Anfall
            if ($daysAfterSeizure !== null && $daysAfterSeizure <= 3) {
                // 0-3 Tage nach Anfall: schlechter
                $baseRating = rand(5, 7);
            } elseif ($daysAfterSeizure !== null && $daysAfterSeizure <= 5) {
                // 4-5 Tage nach Anfall: noch leicht erhöht
                $baseRating = rand(4, 6);
            }
            // Vor dem Anfall: normales Niveau (keine Änderung)
        } elseif ($symptomId === 'stress') {
            // Stress: hat Schwankungen (kein klares Muster zu Anfällen)
            // Zufällige Schwankungen, unabhängig von Anfällen
            $randomFactor = rand(0, 10);
            if ($randomFactor <= 2) {
                // 20% Chance auf erhöhten Stress
                $baseRating = rand(5, 7);
            } elseif ($randomFactor <= 4) {
                // 20% Chance auf niedrigen Stress
                $baseRating = rand(1, 3);
            }
            // Ansonsten: Grundniveau (2-4)
        }
        
        // Füge natürliche Variation hinzu
        $rating = $baseRating + $variation;
        
        // Begrenze auf 1-10
        return max(1, min(10, $rating));
    }
}
