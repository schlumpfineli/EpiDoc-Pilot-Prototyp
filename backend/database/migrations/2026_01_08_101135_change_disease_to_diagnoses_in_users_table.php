<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Für SQLite: Wir müssen die Spalte neu erstellen
        if (DB::getDriverName() === 'sqlite') {
            // Füge neue Spalte hinzu
            DB::statement('ALTER TABLE users ADD COLUMN diagnoses TEXT');
            
            // Migriere bestehende Daten: Konvertiere disease String zu JSON-Array
            $users = DB::table('users')->whereNotNull('disease')->get();
            foreach ($users as $user) {
                if ($user->disease) {
                    $diagnosis = [
                        'type' => $user->disease,
                        'diagnosis_date' => null,
                        'comment' => null,
                    ];
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['diagnoses' => json_encode([$diagnosis])]);
                }
            }
            
            // Lösche alte Spalte (SQLite unterstützt kein DROP COLUMN direkt)
            // Wir erstellen eine neue Tabelle ohne disease
            DB::statement('
                CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    email_verified_at TIMESTAMP,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(255) NOT NULL DEFAULT "patient",
                    address VARCHAR(500),
                    insurance_company VARCHAR(255),
                    ahv_number VARCHAR(255),
                    diagnoses TEXT,
                    doctors TEXT,
                    clinics TEXT,
                    pharmacies TEXT,
                    emergency_contact TEXT,
                    remember_token VARCHAR(100),
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP
                )
            ');
            
            DB::statement('
                INSERT INTO users_new 
                (id, name, email, email_verified_at, password, role, address, insurance_company, ahv_number, diagnoses, doctors, clinics, pharmacies, emergency_contact, remember_token, created_at, updated_at)
                SELECT 
                    id, name, email, email_verified_at, password, role, address, insurance_company, ahv_number, 
                    CASE 
                        WHEN disease IS NOT NULL THEN json_array(json_object("type", disease, "diagnosis_date", null, "comment", null))
                        ELSE NULL
                    END as diagnoses,
                    doctors, clinics, pharmacies, emergency_contact, remember_token, created_at, updated_at
                FROM users
            ');
            
            Schema::dropIfExists('users');
            DB::statement('ALTER TABLE users_new RENAME TO users');
            
            // Erstelle Indexe neu
            DB::statement('CREATE UNIQUE INDEX users_email_unique ON users(email)');
        } else {
            // Für andere Datenbanken (MySQL, PostgreSQL)
            Schema::table('users', function (Blueprint $table) {
                // Migriere bestehende Daten
                $users = DB::table('users')->whereNotNull('disease')->get();
                foreach ($users as $user) {
                    if ($user->disease) {
                        $diagnosis = [
                            'type' => $user->disease,
                            'diagnosis_date' => null,
                            'comment' => null,
                        ];
                        DB::table('users')
                            ->where('id', $user->id)
                            ->update(['diagnoses' => json_encode([$diagnosis])]);
                    }
                }
                
                $table->json('diagnoses')->nullable()->after('ahv_number');
            });
            
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('disease');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            // Für Rollback: Erstelle disease Spalte wieder
            DB::statement('ALTER TABLE users ADD COLUMN disease VARCHAR(255)');
            
            // Konvertiere erste Diagnose zurück zu disease
            $users = DB::table('users')->whereNotNull('diagnoses')->get();
            foreach ($users as $user) {
                if ($user->diagnoses) {
                    $diagnoses = json_decode($user->diagnoses, true);
                    if (is_array($diagnoses) && count($diagnoses) > 0) {
                        DB::table('users')
                            ->where('id', $user->id)
                            ->update(['disease' => $diagnoses[0]['type'] ?? null]);
                    }
                }
            }
            
            // Lösche diagnoses Spalte (wieder über Tabellen-Neuerstellung)
            // (Vereinfachte Version für Rollback)
            Schema::table('users', function (Blueprint $table) {
                // SQLite unterstützt kein DROP COLUMN, daher nur als Hinweis
            });
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->string('disease')->nullable()->after('role');
            });
            
            // Konvertiere erste Diagnose zurück zu disease
            $users = DB::table('users')->whereNotNull('diagnoses')->get();
            foreach ($users as $user) {
                if ($user->diagnoses) {
                    $diagnoses = json_decode($user->diagnoses, true);
                    if (is_array($diagnoses) && count($diagnoses) > 0) {
                        DB::table('users')
                            ->where('id', $user->id)
                            ->update(['disease' => $diagnoses[0]['type'] ?? null]);
                    }
                }
            }
            
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('diagnoses');
            });
        }
    }
};
