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
        Schema::create('medications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('dose');
            $table->enum('time_of_day', ['morning', 'noon', 'evening', 'night', 'emergency']);
            $table->text('comment')->nullable();
            $table->boolean('archived')->default(false);
            $table->text('discontinuation_reason')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            // Index für schnelle Abfragen
            $table->index(['user_id', 'archived']);
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
