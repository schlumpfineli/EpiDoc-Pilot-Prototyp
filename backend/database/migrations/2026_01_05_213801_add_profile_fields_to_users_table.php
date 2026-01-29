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
        Schema::table('users', function (Blueprint $table) {
            $table->string('disease')->nullable()->after('role');
            $table->json('doctors')->nullable()->after('disease'); // Array von Ärzten
            $table->json('clinics')->nullable()->after('doctors'); // Array von Kliniken
            $table->json('pharmacies')->nullable()->after('clinics'); // Array von Apotheken
            $table->json('emergency_contact')->nullable()->after('pharmacies'); // Notfallkontakt
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'disease',
                'doctors',
                'clinics',
                'pharmacies',
                'emergency_contact',
            ]);
        });
    }
};
