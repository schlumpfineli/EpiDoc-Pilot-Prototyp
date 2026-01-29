<?php

/**
 * Generiert realistische Seed-Daten für Epilepsie-App
 * 
 * Dieses Skript generiert strukturierte Seed-Daten mit erkennbaren Mustern:
 * - 30 Tage Zeitraum
 * - Tägliche Befinden-Einträge (Innere Unruhe, optional Schlaf-Wach-Rhythmus, Stress)
 * - 3-5 Anfälle mit erkennbarem Muster
 * - Innere Unruhe steigt 2-4 Tage vor einem Anfall deutlich an
 */

// Konfiguration
$days = 30;
$seizureCount = rand(3, 5);
$symptoms = [
    'restlessness' => ['label' => 'Innere Unruhe', 'category' => 'mental', 'enabled' => true],
    'sleep-rhythm' => ['label' => 'Schlaf-Wach-Rhythmus', 'category' => 'lifestyle', 'enabled' => rand(0, 1) === 1],
    'stress' => ['label' => 'Stress', 'category' => 'mental', 'enabled' => rand(0, 1) === 1],
];

// Generiere Anfall-Daten
$seizureDates = [];
$selectedDays = [];
$minDistance = 5;

$allDays = range(0, $days - 1);
shuffle($allDays);

foreach ($allDays as $day) {
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
$startDate = new DateTime();
$startDate->modify("-{$days} days");

$seizures = [];
foreach ($selectedDays as $day) {
    $date = clone $startDate;
    $date->modify("+{$day} days");
    $seizureDates[] = $day;
    
    $seizures[] = [
        'date' => $date->format('Y-m-d'),
        'day' => $day,
        'seizure_count' => rand(1, 2),
        'duration_minutes' => rand(1, 8),
        'duration_seconds' => rand(0, 59),
        'emergency_med' => rand(0, 3) === 0,
        'type' => ['focal', 'generalized'][rand(0, 1)],
    ];
}

// Generiere Befinden-Daten
$timesOfDay = ['morning', 'noon', 'evening'];
$befindenData = [];

for ($day = 0; $day < $days; $day++) {
    $date = clone $startDate;
    $date->modify("+{$day} days");
    
    // Berechne Abstand zu Anfällen
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
    
    $dayData = [
        'date' => $date->format('Y-m-d'),
        'day' => $day,
        'days_before_seizure' => $daysBeforeSeizure,
        'days_after_seizure' => $daysAfterSeizure,
        'symptoms' => [],
    ];
    
    foreach ($symptoms as $symptomId => $config) {
        if (!$config['enabled']) {
            continue;
        }
        
        $timeCount = rand(1, 3) <= 2 ? 1 : 2;
        $selectedTimes = array_rand($timesOfDay, min($timeCount, count($timesOfDay)));
        if (!is_array($selectedTimes)) {
            $selectedTimes = [$selectedTimes];
        }
        
        foreach ($selectedTimes as $timeIndex) {
            $timeOfDay = $timesOfDay[$timeIndex];
            
            $rating = calculateRating(
                $symptomId,
                $daysBeforeSeizure,
                $daysAfterSeizure,
                $day
            );
            
            $dayData['symptoms'][] = [
                'symptom_id' => $symptomId,
                'symptom_label' => $config['label'],
                'category_id' => $config['category'],
                'time_of_day' => $timeOfDay,
                'rating' => $rating,
            ];
        }
    }
    
    $befindenData[] = $dayData;
}

// Ausgabe als JSON
$output = [
    'metadata' => [
        'generated_at' => date('Y-m-d H:i:s'),
        'timeframe_days' => $days,
        'seizure_count' => count($seizures),
        'symptoms' => array_map(function($s) { return $s['label']; }, array_filter($symptoms, fn($s) => $s['enabled'])),
    ],
    'seizures' => $seizures,
    'befinden' => $befindenData,
];

echo json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

// Hilfsfunktion zur Berechnung des Ratings
function calculateRating(
    string $symptomId,
    ?int $daysBeforeSeizure,
    ?int $daysAfterSeizure,
    int $currentDay
): int {
    $baseRating = rand(2, 4);
    $variation = rand(-1, 1);
    
    if ($symptomId === 'restlessness') {
        // Innere Unruhe: Steigt 2-4 Tage vor Anfall deutlich an
        if ($daysBeforeSeizure !== null && $daysBeforeSeizure <= 4 && $daysBeforeSeizure >= 2) {
            $baseRating = rand(6, 8);
        } elseif ($daysBeforeSeizure === 1) {
            $baseRating = rand(5, 7);
        } elseif ($daysAfterSeizure === 0) {
            $baseRating = rand(5, 7);
        } elseif ($daysAfterSeizure !== null && $daysAfterSeizure <= 2) {
            $baseRating = rand(3, 5);
        }
    } elseif ($symptomId === 'sleep-rhythm') {
        // Schlaf-Wach-Rhythmus: leicht instabil in Phasen erhöhter Unruhe
        if ($daysBeforeSeizure !== null && $daysBeforeSeizure <= 4 && $daysBeforeSeizure >= 2) {
            $baseRating = rand(4, 6);
        } elseif ($daysAfterSeizure !== null && $daysAfterSeizure <= 1) {
            $baseRating = rand(3, 5);
        }
    } elseif ($symptomId === 'stress') {
        // Stress: kann begleitend erhöht sein
        if ($daysBeforeSeizure !== null && $daysBeforeSeizure <= 4 && $daysBeforeSeizure >= 2) {
            if (rand(0, 1) === 1) {
                $baseRating = rand(5, 7);
            }
        }
    }
    
    $rating = $baseRating + $variation;
    return max(1, min(10, $rating));
}

