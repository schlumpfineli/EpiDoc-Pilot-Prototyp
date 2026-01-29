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
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['bug', 'feature', 'improvement', 'other'])->default('other');
            $table->text('message');
            $table->string('page_url')->nullable(); // Auf welcher Seite wurde Feedback gegeben
            $table->string('user_agent')->nullable(); // Browser-Info für Debugging
            $table->timestamps();

            // Index für schnelle Abfragen
            $table->index(['user_id', 'created_at']);
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
