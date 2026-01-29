<?php
/**
 * BEISPIEL: Sichere Migration mit Daten-Migration
 * 
 * Diese Datei dient als Vorlage für sichere Migrations.
 * Kopieren Sie diese Datei und passen Sie sie an Ihre Bedürfnisse an.
 * 
 * WICHTIG: Löschen Sie diese Datei nicht - sie dient als Referenz!
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Diese Migration zeigt, wie man sicher:
     * 1. Eine Spalte umbenennt
     * 2. Daten migriert
     * 3. Die alte Spalte entfernt
     */
    public function up(): void
    {
        // Schritt 1: Neue Spalte hinzufügen
        Schema::table('users', function (Blueprint $table) {
            $table->string('full_name')->nullable()->after('name');
        });

        // Schritt 2: Daten von alter Spalte in neue Spalte migrieren
        // Beispiel: Wenn 'name' in 'full_name' umbenannt werden soll
        DB::table('users')->chunkById(100, function ($users) {
            foreach ($users as $user) {
                // Daten migrieren (hier: einfach kopieren)
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['full_name' => $user->name]);
            }
        });

        // Schritt 3: Alte Spalte als nullable markieren (optional, für Sicherheit)
        // Schema::table('users', function (Blueprint $table) {
        //     $table->string('name')->nullable()->change();
        // });

        // Schritt 4: Alte Spalte entfernen (NUR wenn sicher!)
        // WICHTIG: Dies sollte in einer separaten Migration erfolgen,
        // nachdem sichergestellt wurde, dass alles funktioniert!
        // Schema::table('users', function (Blueprint $table) {
        //     $table->dropColumn('name');
        // });
    }

    /**
     * Reverse the migrations.
     * 
     * Diese Methode muss die Migration vollständig rückgängig machen können.
     */
    public function down(): void
    {
        // Schritt 1: Alte Spalte wiederherstellen (falls entfernt)
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable()->after('id');
        });

        // Schritt 2: Daten zurück migrieren
        DB::table('users')->chunkById(100, function ($users) {
            foreach ($users as $user) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['name' => $user->full_name]);
            }
        });

        // Schritt 3: Neue Spalte entfernen
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('full_name');
        });
    }
};

