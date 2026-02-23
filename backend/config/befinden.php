<?php

return [
    /*
    | Bekannte Symptom-IDs aus der App (Kern + optional). Alle anderen gelten als "eigene Symptome".
    */
    'known_symptom_ids' => [
        'sleep-rhythm', 'fatigue', 'stress', 'restlessness', 'concentration',
        'sensitivity', 'irritability', 'medication-adherence',
        'pain', 'depression', 'anxiety', 'headache', 'menstrual',
        'memory-problems', 'confusion', 'loss-of-appetite', 'malaise', 'observation',
    ],

    /*
    | Anzeigenamen für Symptome (zentral, wird in Analytics und API verwendet).
    */
    'symptom_labels' => [
        'sleep-rhythm' => 'Schlaf-Wach-Rhythmus',
        'fatigue' => 'Müdigkeit / Erschöpfung',
        'stress' => 'Stress',
        'restlessness' => 'Innere Unruhe',
        'concentration' => 'Konzentration',
        'sensitivity' => 'Reizempfindlichkeit',
        'irritability' => 'Reizbarkeit',
        'medication-adherence' => 'Medikamente nicht wie geplant',
        'pain' => 'Schmerzen',
        'depression' => 'Depressive Belastung',
        'anxiety' => 'Angst',
        'headache' => 'Kopfschmerz',
        'menstrual' => 'Zyklusbezogene Beschwerden',
        'memory-problems' => 'Gedächtnisprobleme',
        'confusion' => 'Verwirrtheit',
        'loss-of-appetite' => 'Appetitlosigkeit',
        'malaise' => 'Krankheitsgefühl',
        'observation' => 'Beobachtung',
    ],
];
