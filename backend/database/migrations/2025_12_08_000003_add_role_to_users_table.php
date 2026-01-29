<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * SICHER: Diese Migration fügt nur eine neue Spalte hinzu.
     * Bestehende Daten bleiben erhalten, da ein Default-Wert gesetzt wird.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('patient')->after('email');
        });
    }

    /**
     * Reverse the migrations.
     * 
     * WICHTIG: Beim Rollback gehen die Rollen-Daten verloren!
     * Dies ist akzeptabel, da die Spalte optional ist.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};

