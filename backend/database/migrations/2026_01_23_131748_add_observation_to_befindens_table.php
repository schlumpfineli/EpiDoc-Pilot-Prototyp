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
        Schema::table('befindens', function (Blueprint $table) {
            $table->text('observation')->nullable()->after('questions');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('befindens', function (Blueprint $table) {
            $table->dropColumn('observation');
        });
    }
};
