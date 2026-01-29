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
        // Für SQLite müssen wir den Index zuerst löschen
        if (DB::getDriverName() === 'sqlite') {
            // Prüfe, ob category_id_new bereits existiert
            $columns = DB::select("PRAGMA table_info(befindens)");
            $hasNewColumn = false;
            foreach ($columns as $column) {
                if ($column->name === 'category_id_new') {
                    $hasNewColumn = true;
                    break;
                }
            }
            
            if (!$hasNewColumn) {
                // Index löschen
                try {
                    DB::statement('DROP INDEX IF EXISTS befindens_user_id_date_category_id_index');
                } catch (\Exception $e) {
                    // Index existiert möglicherweise nicht
                }
                
                // Neue nullable Spalte hinzufügen
                Schema::table('befindens', function (Blueprint $table) {
                    $table->string('category_id_new')->nullable()->after('date');
                });
                
                // Daten kopieren
                DB::statement('UPDATE befindens SET category_id_new = category_id');
                
                // Alte Spalte entfernen
                Schema::table('befindens', function (Blueprint $table) {
                    $table->dropColumn('category_id');
                });
                
                // Neue Spalte umbenennen
                DB::statement('ALTER TABLE befindens RENAME COLUMN category_id_new TO category_id');
            }
            
            // Index wieder erstellen (ohne category_id, da es jetzt nullable ist)
            try {
                DB::statement('DROP INDEX IF EXISTS befindens_user_id_date_index');
            } catch (\Exception $e) {
                // Index existiert möglicherweise nicht
            }
            
            Schema::table('befindens', function (Blueprint $table) {
                $table->index(['user_id', 'date']);
            });
        } else {
            // Für MySQL/PostgreSQL: Einfach nullable machen
        Schema::table('befindens', function (Blueprint $table) {
                $table->string('category_id')->nullable()->change();
        });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            // Index löschen
            try {
                DB::statement('DROP INDEX IF EXISTS befindens_user_id_date_index');
            } catch (\Exception $e) {
                // Index existiert möglicherweise nicht
            }
            
            // Spalte wieder als NOT NULL setzen
            Schema::table('befindens', function (Blueprint $table) {
                $table->string('category_id_new')->after('date');
            });
            
            // Daten kopieren (nur nicht-null Werte, Standardwert für null)
            DB::statement("UPDATE befindens SET category_id_new = COALESCE(category_id, 'general') WHERE category_id IS NOT NULL");
            DB::statement("UPDATE befindens SET category_id_new = 'general' WHERE category_id IS NULL");
            
            Schema::table('befindens', function (Blueprint $table) {
                $table->dropColumn('category_id');
            });
            
            DB::statement('ALTER TABLE befindens RENAME COLUMN category_id_new TO category_id');
            
            // Index wieder erstellen
            Schema::table('befindens', function (Blueprint $table) {
                $table->index(['user_id', 'date', 'category_id']);
            });
        } else {
        Schema::table('befindens', function (Blueprint $table) {
                $table->string('category_id')->nullable(false)->change();
        });
        }
    }
};
