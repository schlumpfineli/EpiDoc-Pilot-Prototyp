<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Erstellt die Medikamenten-Tabelle für den EpiDoc-Prototypen.
     */
    public function up(): void
    {
        Schema::create('medications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');                          // Medikamentenname
            $table->string('dose')->nullable();              // Dosierung, z.B. "500mg"
            $table->string('frequency')->nullable();         // Häufigkeit, z.B. "2x täglich"
            $table->json('time_of_day')->nullable();         // ["morning","noon","evening","night"]
            $table->text('notes')->nullable();               // Bemerkungen
            $table->date('prescribed_since')->nullable();    // Verschrieben seit
            $table->boolean('active')->default(true);        // Aktiv oder abgesetzt
            $table->date('discontinued_at')->nullable();     // Abgesetzt am
            $table->text('discontinuation_reason')->nullable(); // Grund für Absetzung
            $table->timestamps();

            $table->index(['user_id', 'active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medications');
    }
};
