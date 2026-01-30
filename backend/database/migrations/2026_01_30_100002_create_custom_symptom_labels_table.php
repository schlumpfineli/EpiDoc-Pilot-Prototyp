<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_symptom_labels', function (Blueprint $table) {
            $table->id();
            $table->string('symptom_id', 255)->unique();
            $table->string('label', 500);
            $table->timestamps();

            $table->index('symptom_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_symptom_labels');
    }
};
