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
        if (DB::getDriverName() === 'sqlite') {
            // Für SQLite: Neue nullable Spalte hinzufügen
            Schema::table('befindens', function (Blueprint $table) {
                $table->integer('rating_new')->nullable()->after('time_of_day');
            });
            
            // Daten kopieren
            DB::statement('UPDATE befindens SET rating_new = rating');
            
            // Alte Spalte entfernen
            Schema::table('befindens', function (Blueprint $table) {
                $table->dropColumn('rating');
            });
            
            // Neue Spalte umbenennen
            DB::statement('ALTER TABLE befindens RENAME COLUMN rating_new TO rating');
        } else {
            // Für MySQL/PostgreSQL: Einfach nullable machen
        Schema::table('befindens', function (Blueprint $table) {
                $table->integer('rating')->nullable()->change();
        });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            // Spalte wieder als NOT NULL setzen
            Schema::table('befindens', function (Blueprint $table) {
                $table->integer('rating_new')->default(5)->after('time_of_day');
            });
            
            // Daten kopieren (Standardwert für null)
            DB::statement('UPDATE befindens SET rating_new = COALESCE(rating, 5)');
            
            Schema::table('befindens', function (Blueprint $table) {
                $table->dropColumn('rating');
            });
            
            DB::statement('ALTER TABLE befindens RENAME COLUMN rating_new TO rating');
        } else {
        Schema::table('befindens', function (Blueprint $table) {
                $table->integer('rating')->default(5)->nullable(false)->change();
        });
        }
    }
};
