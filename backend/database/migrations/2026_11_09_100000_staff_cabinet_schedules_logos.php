<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            // Opening hours per weekday, index 0 = Sunday: {open, close} or null (closed). Null = use hours_open/close.
            $table->json('hours_week')->nullable()->after('closed_days');
            $table->string('logo_path')->nullable()->after('whatsapp');
        });

        Schema::table('masters', function (Blueprint $table) {
            // Shift per weekday, index 0 = Sunday: {start, end} or null (day off). Null = use work_days + shift.
            $table->json('schedule')->nullable()->after('shift_end');
        });

        Schema::table('business_members', function (Blueprint $table) {
            // role = staff: the master this person is. Staff see their own cabinet, not the salon panel.
            $table->string('master_id', 64)->nullable()->after('branch_id');
        });

        Schema::table('bookings', function (Blueprint $table) {
            // Where a client booked from: ios | android | web (null for salon-made bookings and old rows).
            $table->string('channel', 8)->nullable()->after('source');
        });

        Schema::create('attendances', function (Blueprint $table) {
            $table->string('id', 26)->primary();
            $table->string('business_id', 64)->index();
            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->string('master_id', 64)->index();
            $table->foreign('master_id')->references('id')->on('masters')->cascadeOnDelete();
            $table->string('user_id', 26)->nullable();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            // The Baku calendar day of the check-in.
            $table->date('day');
            $table->timestamp('check_in_at');
            $table->timestamp('check_out_at')->nullable();
            $table->timestamps();
            $table->index(['business_id', 'day']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
        Schema::table('bookings', fn (Blueprint $table) => $table->dropColumn('channel'));
        Schema::table('business_members', fn (Blueprint $table) => $table->dropColumn('master_id'));
        Schema::table('masters', fn (Blueprint $table) => $table->dropColumn('schedule'));
        Schema::table('businesses', fn (Blueprint $table) => $table->dropColumn(['hours_week', 'logo_path']));
    }
};
