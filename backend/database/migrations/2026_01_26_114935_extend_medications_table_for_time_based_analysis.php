<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Extends medications table to support time-based analysis:
     * - start_date: When medication was first started
     * - end_date: When medication was discontinued (optional)
     * - intake_type: regular / irregular
     * - emergency_medication: boolean flag for emergency meds
     */
    public function up(): void
    {
        Schema::table('medications', function (Blueprint $table) {
            // Start date of medication (required for analysis)
            $table->date('start_date')->nullable()->after('prescribed_at');
            
            // End date (optional, for discontinued medications)
            $table->date('end_date')->nullable()->after('start_date');
            
            // Type of intake pattern
            $table->enum('intake_type', ['regular', 'irregular'])->default('regular')->after('end_date');
            
            // Flag for emergency medications (not for regular analysis)
            $table->boolean('emergency_medication')->default(false)->after('intake_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medications', function (Blueprint $table) {
            $table->dropColumn([
                'start_date',
                'end_date',
                'intake_type',
                'emergency_medication',
            ]);
        });
    }
};
