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
        $this->generateDemoData($relativeUser);
    }

    /**
     * Generiert realistische Demo-Daten für einen Benutzer
     * WICHTIG: Nur für Test-User! Normale Registrierungen erhalten KEINE Demo-Daten.
     *
     * Generiert 6 Monate (180 Tage) Daten mit erkennbaren Mustern:
     * - Befinden: Schlaf-Wach-Rhythmus, Stress, Innere Unruhe (täglich)
     * - Anfälle: 4–6 pro Monat, fokal oder Absence, mehrheitlich einzeln, ab und zu Serien
     * - Schlaf-Wach-Rhythmus: 1–2 Tage NACH Anfall schlechter
     * - Stress: höher direkt VOR dem Anfall
     * - Innere Unruhe: 2–3 Tage VOR dem Anfall erhöht
     */
    private function generateDemoData(User $user): void
    {
        // Sicherheitsprüfung: Nur für Test-User Demo-Daten generieren
        $testUserEmails = ['test@example.com', 'patient@test.de', 'angehoeriger@test.de'];
        if (!in_array($user->email, $testUserEmails)) {
            return;
        }

        $hasBefinden = \App\Models\Befinden::where('user_id', $user->id)->exists();
        $hasSeizures = \App\Models\Seizure::where('user_id', $user->id)->exists();

        if (!$hasBefinden && !$hasSeizures) {
            $totalDays = 180; // 6 Monate
            $daysAgo = $totalDays - 1; // Tag 0 = vor 179 Tagen, Tag 179 = heute

            // Schritt 1: Anfälle – 4–6 pro Monat = 24–36 über 6 Monate
            $seizureCount = rand(24, 36);
            $seizureDates = [];
            $days = range(0, $totalDays - 1);
            shuffle($days);
            $selectedDays = [];
            $minDistance = 3; // mind. 3 Tage Abstand für 4–6/Monat

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
            sort($selectedDays);

            foreach ($selectedDays as $day) {
                $date = now()->subDays($daysAgo - $day);
                $seizureDates[] = $day;
                // Mehrheit einzelne Anfälle (75%), ab und zu Serien (25%)
                $seizureCountThisDay = rand(1, 10) <= 8 ? 1 : rand(2, 3);
                $types = ['focal', 'absence'];
                $afterEffects = ['confusion', 'tiredness', 'headache', 'muscle_ache'];
                $triggers = ['stress', 'lack_of_sleep', 'alcohol', 'flashing_lights'];
                \App\Models\Seizure::create([
                    'user_id' => $user->id,
                    'date' => $date->format('Y-m-d'),
                    'seizure_count' => $seizureCountThisDay,
                    'duration_minutes' => rand(1, 8),
                    'duration_seconds' => rand(0, 59),
                    'emergency_med' => rand(0, 4) === 0,
                    'type' => [$types[rand(0, 1)]],
                    'after_effects' => array_slice($afterEffects, 0, rand(0, 2)) ?: null,
                    'triggers' => array_slice($triggers, 0, rand(0, 2)) ?: null,
                ]);
            }

            // Schritt 2: Befinden – täglich alle drei Symptome (1x pro Tag)
            $timesOfDay = ['morning', 'noon', 'evening'];

            for ($day = 0; $day < $totalDays; $day++) {
                $date = now()->subDays($daysAgo - $day);

                $daysBeforeSeizure = null;
                $daysAfterSeizure = null;
                foreach ($seizureDates as $seizureDay) {
                    if ($day < $seizureDay && ($daysBeforeSeizure === null || $seizureDay - $day < $daysBeforeSeizure)) {
                        $daysBeforeSeizure = $seizureDay - $day;
                    }
                    if ($day >= $seizureDay && ($daysAfterSeizure === null || $day - $seizureDay < $daysAfterSeizure)) {
                        $daysAfterSeizure = $day - $seizureDay;
                    }
                }

                // Innere Unruhe: täglich
                $ratingRestlessness = $this->calculateRating('restlessness', $daysBeforeSeizure, $daysAfterSeizure, $day);
                \App\Models\Befinden::create([
                    'user_id' => $user->id,
                    'date' => $date->format('Y-m-d'),
                    'category_id' => 'mental',
                    'symptom_id' => 'restlessness',
                    'time_of_day' => $timesOfDay[array_rand($timesOfDay)],
                    'rating' => $ratingRestlessness,
                ]);

                // Schlaf-Wach-Rhythmus: täglich
                $ratingSleep = $this->calculateRating('sleep-rhythm', $daysBeforeSeizure, $daysAfterSeizure, $day);
                \App\Models\Befinden::create([
                    'user_id' => $user->id,
                    'date' => $date->format('Y-m-d'),
                    'category_id' => 'lifestyle',
                    'symptom_id' => 'sleep-rhythm',
                    'time_of_day' => $timesOfDay[array_rand($timesOfDay)],
                    'rating' => $ratingSleep,
                ]);

                // Stress: täglich
                $ratingStress = $this->calculateRating('stress', $daysBeforeSeizure, $daysAfterSeizure, $day);
                \App\Models\Befinden::create([
                    'user_id' => $user->id,
                    'date' => $date->format('Y-m-d'),
                    'category_id' => 'mental',
                    'symptom_id' => 'stress',
                    'time_of_day' => $timesOfDay[array_rand($timesOfDay)],
                    'rating' => $ratingStress,
                ]);
            }
        }
    }

    /**
     * Berechnet den Rating-Wert (1-10) basierend auf Symptom und Anfall-Nähe
     *
     * Muster:
     * - Schlaf-Wach-Rhythmus: 1–2 Tage NACH Anfall schlechter (höherer Wert)
     * - Stress: höher direkt VOR dem Anfall (1 Tag davor)
     * - Innere Unruhe: 2–3 Tage VOR dem Anfall erhöht
     */
    private function calculateRating(
        string $symptomId,
        ?int $daysBeforeSeizure,
        ?int $daysAfterSeizure,
        int $currentDay
    ): int {
        $baseRating = rand(2, 4);
        $variation = rand(-1, 1);

        if ($symptomId === 'sleep-rhythm') {
            // Schlaf-Wach-Rhythmus: 1–2 Tage NACH Anfall schlechter (höherer Wert = schlechter)
            if ($daysAfterSeizure !== null && $daysAfterSeizure >= 1 && $daysAfterSeizure <= 2) {
                $baseRating = rand(6, 8);
            } elseif ($daysAfterSeizure === 0) {
                // Am Anfallstag kann es schon leicht schlechter sein
                $baseRating = rand(4, 6);
            } elseif ($daysAfterSeizure !== null && $daysAfterSeizure <= 4) {
                $baseRating = rand(3, 5);
            }
        } elseif ($symptomId === 'stress') {
            // Stress: höher direkt VOR dem Anfall (Tag vor dem Anfall)
            if ($daysBeforeSeizure === 1) {
                $baseRating = rand(6, 8);
            } elseif ($daysBeforeSeizure === 0) {
                // Am Anfallstag kann Stress noch erhöht sein
                $baseRating = rand(5, 7);
            } else {
                $baseRating = rand(2, 4);
            }
        } elseif ($symptomId === 'restlessness') {
            // Innere Unruhe: 2–3 Tage VOR dem Anfall erhöht
            if ($daysBeforeSeizure !== null && ($daysBeforeSeizure === 2 || $daysBeforeSeizure === 3)) {
                $baseRating = rand(6, 8);
            } elseif ($daysBeforeSeizure === 1) {
                $baseRating = rand(5, 7);
            } elseif ($daysAfterSeizure !== null && $daysAfterSeizure <= 2) {
                $baseRating = rand(3, 5);
            }
        }

        $rating = $baseRating + $variation;
        return max(1, min(10, $rating));
    }
}
