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
        Schema::create('usage_logs', function (Blueprint $table) {
            $table->id();
            $table->string('endpoint'); // z.B. '/api/befinden', '/api/seizures'
            $table->string('method', 10); // GET, POST, PUT, DELETE
            $table->integer('status_code'); // HTTP Status Code
            $table->string('function_name')->nullable(); // z.B. 'befinden', 'seizures', 'medications'
            $table->date('date'); // Für schnelle Datumsabfragen
            $table->timestamps();

            // Indizes für schnelle Abfragen
            $table->index(['function_name', 'date']);
            $table->index(['endpoint', 'date']);
            $table->index('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usage_logs');
    }
};
