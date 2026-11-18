<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Test salons (usta:test-salons) work like real ones but never appear to customers.
        Schema::table('businesses', function (Blueprint $table) {
            $table->boolean('is_test')->default(false)->index()->after('status');
        });

        // The team's own addresses: left out of the traffic stats and never flagged.
        Schema::create('traffic_ignored_ips', function (Blueprint $table) {
            $table->string('ip', 45)->primary();
            $table->string('note', 120)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('traffic_ignored_ips');
        Schema::table('businesses', fn (Blueprint $table) => $table->dropColumn('is_test'));
    }
};
