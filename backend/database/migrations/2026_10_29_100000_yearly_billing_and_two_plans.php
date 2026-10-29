<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('billing_period', 8)->default('month')->after('plan');
        });
        Schema::table('payments', function (Blueprint $table) {
            $table->string('billing_period', 8)->default('month')->after('plan');
        });

        // Studio is gone; its salons keep everything they had on Pro.
        DB::table('subscriptions')->where('plan', 'studio')->update(['plan' => 'pro']);
    }

    public function down(): void
    {
        Schema::table('payments', fn (Blueprint $table) => $table->dropColumn('billing_period'));
        Schema::table('subscriptions', fn (Blueprint $table) => $table->dropColumn('billing_period'));
    }
};
