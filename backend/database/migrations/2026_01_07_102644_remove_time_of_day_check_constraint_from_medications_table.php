<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Entfernt die CHECK-Constraint von time_of_day, damit mehrere Werte
     * (komma-separiert) gespeichert werden können.
     */
    public function up(): void
    {
        // SQLite unterstützt kein direktes Entfernen von CHECK-Constraints
        // Wir müssen die Tabelle neu erstellen
        if (DB::getDriverName() === 'sqlite') {
            // Erstelle temporäre Tabelle ohne CHECK-Constraint
            DB::statement('
                CREATE TABLE medications_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    dose VARCHAR(255) NOT NULL,
                    time_of_day VARCHAR(255) NOT NULL,
                    comment TEXT,
                    archived INTEGER NOT NULL DEFAULT 0,
                    discontinuation_reason TEXT,
                    archived_at TIMESTAMP,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            ');
            
            // Kopiere Daten
            DB::statement('
                INSERT INTO medications_new 
                SELECT * FROM medications
            ');
            
            // Lösche alte Tabelle
            Schema::dropIfExists('medications');
            
            // Benenne neue Tabelle um
            DB::statement('ALTER TABLE medications_new RENAME TO medications');
            
            // Erstelle Indexe neu
            DB::statement('CREATE INDEX medications_user_id_archived_index ON medications(user_id, archived)');
        } else {
            // Für andere Datenbanken: Spalte ändern (entfernt automatisch CHECK-Constraint)
            Schema::table('medications', function (Blueprint $table) {
                $table->string('time_of_day')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Für Rollback: Setze ENUM wieder ein (nur erster Wert wird beibehalten)
        if (DB::getDriverName() === 'sqlite') {
            // SQLite unterstützt kein ENUM, daher verwenden wir String mit CHECK
            DB::statement('
                CREATE TABLE medications_old (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    dose VARCHAR(255) NOT NULL,
                    time_of_day VARCHAR(255) NOT NULL CHECK(time_of_day IN (\'morning\', \'noon\', \'evening\', \'night\', \'emergency\')),
                    comment TEXT,
                    archived INTEGER NOT NULL DEFAULT 0,
                    discontinuation_reason TEXT,
                    archived_at TIMESTAMP,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            ');
            
            // Kopiere Daten (nur erster Wert von time_of_day)
            DB::statement('
                INSERT INTO medications_old 
                SELECT 
                    id,
                    user_id,
                    name,
                    dose,
                    CASE 
                        WHEN time_of_day LIKE \'morning%\' THEN \'morning\'
                        WHEN time_of_day LIKE \'noon%\' THEN \'noon\'
                        WHEN time_of_day LIKE \'evening%\' THEN \'evening\'
                        WHEN time_of_day LIKE \'night%\' THEN \'night\'
                        WHEN time_of_day LIKE \'emergency%\' THEN \'emergency\'
                        ELSE SUBSTR(time_of_day, 1, INSTR(time_of_day || \',\', \',\') - 1)
                    END as time_of_day,
                    comment,
                    archived,
                    discontinuation_reason,
                    archived_at,
                    created_at,
                    updated_at
                FROM medications
            ');
            
            Schema::dropIfExists('medications');
            DB::statement('ALTER TABLE medications_old RENAME TO medications');
            DB::statement('CREATE INDEX medications_user_id_archived_index ON medications(user_id, archived)');
        } else {
            Schema::table('medications', function (Blueprint $table) {
                $table->enum('time_of_day', ['morning', 'noon', 'evening', 'night', 'emergency'])->change();
            });
        }
    }
};
