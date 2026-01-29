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
        Schema::create('seizures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->json('type')->nullable(); // Array von Anfallstypen
            $table->string('custom_type')->nullable();
            $table->text('felt_before')->nullable();
            $table->text('felt_symptoms')->nullable();
            $table->integer('seizure_count')->default(1);
            $table->integer('duration_minutes')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->json('after_effects')->nullable(); // Array von Nachwirkungen
            $table->text('custom_after_effects')->nullable();
            $table->json('triggers')->nullable(); // Array von Auslösern
            $table->text('custom_triggers')->nullable();
            $table->boolean('emergency_med')->default(false);
            $table->string('emergency_med_name')->nullable();
            $table->string('video_path')->nullable(); // Pfad zum Video
            $table->timestamps();

            // Index für schnelle Abfragen
            $table->index(['user_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seizures');
    }
};
