<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Entfernt die Medikamenten-Tabelle für den EpiDoc-Pilot (Medikamenten-Feature aus dem Pilot entfernt).
     */
    public function up(): void
    {
        Schema::dropIfExists('medications');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tabelle wird nicht wiederhergestellt – Medikamenten-Feature bleibt im Pilot deaktiviert.
    }
};
