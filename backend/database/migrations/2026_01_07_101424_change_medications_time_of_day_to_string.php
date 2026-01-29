<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('medications', function (Blueprint $table) {
            // Ändere ENUM zu String, um mehrere Zeitpunkte zu unterstützen
            $table->string('time_of_day')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medications', function (Blueprint $table) {
            // Zurück zu ENUM (nur erster Wert wird beibehalten)
            $table->enum('time_of_day', ['morning', 'noon', 'evening', 'night', 'emergency'])->change();
        });
    }
};
