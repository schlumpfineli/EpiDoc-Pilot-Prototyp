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
        Schema::create('befindens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->string('category_id'); // physical, mental, lifestyle, alternative
            $table->string('symptom_id'); // headache, stress, etc.
            $table->enum('time_of_day', ['morning', 'noon', 'evening']);
            $table->integer('rating')->default(5); // 0-10
            $table->json('questions')->nullable(); // Für optionale Fragen/Antworten
            $table->timestamps();

            // Index für schnelle Abfragen
            $table->index(['user_id', 'date']);
            $table->index(['user_id', 'date', 'category_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('befindens');
    }
};
