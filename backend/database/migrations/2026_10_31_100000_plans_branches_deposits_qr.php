<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Sadə / Start / Pro: the map-only plan, Pro branches and managers,
 * deposits, the waitlist, one-time QR reviews and the WhatsApp add-on.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            // A Pro branch: billed and owned through the parent (the main salon).
            $table->string('parent_id', 64)->nullable()->after('owner_id')->index();
            // Sadə: where "Book" sends clients (the salon's own page, DIKIDI, WhatsApp…).
            $table->string('booking_url', 500)->nullable()->after('whatsapp');
            // WhatsApp add-on: messages left in the bought pack and when it runs out.
            $table->unsignedInteger('whatsapp_quota')->default(0);
            $table->unsignedInteger('whatsapp_used')->default(0);
            $table->timestamp('whatsapp_until')->nullable();
            // Weighted review totals in tenths (a booked visit counts 10, a QR review 8).
            $table->unsignedInteger('review_weight')->default(0)->after('review_sum');
            $table->unsignedInteger('review_weighted_sum')->default(0)->after('review_weight');
        });
        Schema::table('masters', function (Blueprint $table) {
            $table->unsignedInteger('review_weight')->default(0)->after('review_sum');
            $table->unsignedInteger('review_weighted_sum')->default(0)->after('review_weight');
        });
        DB::table('businesses')->update(['review_weight' => DB::raw('review_count * 10'), 'review_weighted_sum' => DB::raw('review_sum * 10')]);
        DB::table('masters')->update(['review_weight' => DB::raw('review_count * 10'), 'review_weighted_sum' => DB::raw('review_sum * 10')]);

        Schema::table('services', function (Blueprint $table) {
            // Pro: none | fixed (whole AZN) | percent (of the price).
            $table->string('deposit_type', 8)->default('none')->after('price');
            $table->unsignedInteger('deposit_value')->default(0)->after('deposit_type');
        });

        Schema::table('bookings', function (Blueprint $table) {
            // Deposit in whole AZN; status: pending | paid | refunded | kept | applied | expired.
            $table->unsignedInteger('deposit')->default(0)->after('total');
            $table->string('deposit_status', 10)->nullable()->after('deposit');
            // pending_payment bookings hold the slot until then.
            $table->timestamp('hold_until')->nullable()->after('deposit_status');
            $table->index(['status', 'hold_until']);
        });

        Schema::table('payments', function (Blueprint $table) {
            // subscription | deposit | whatsapp
            $table->string('kind', 12)->default('subscription')->after('business_id');
            $table->string('booking_id', 26)->nullable()->after('kind')->index();
            $table->string('user_id', 26)->nullable()->after('booking_id');
            // Pro: locations billed in this payment (the main salon + branches).
            $table->unsignedSmallInteger('locations')->nullable()->after('billing_period');
            $table->timestamp('refunded_at')->nullable()->after('paid_at');
        });

        Schema::table('reviews', function (Blueprint $table) {
            // booking: after a visit booked here. qr: a one-time code from the master.
            $table->string('source', 8)->default('booking')->after('booking_id');
            // QR reviews rate the master separately; null = same as the salon rating.
            $table->unsignedTinyInteger('master_rating')->nullable()->after('rating');
        });

        Schema::create('review_codes', function (Blueprint $table) {
            $table->string('id', 26)->primary();
            $table->string('business_id', 64)->index();
            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->string('master_id', 64)->nullable();
            $table->string('created_by', 26)->nullable();
            // sha256 of the code in the QR; the code itself is never stored.
            $table->string('token_hash', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->string('review_id', 64)->nullable();
            $table->timestamps();
        });

        Schema::create('salon_clicks', function (Blueprint $table) {
            $table->id();
            $table->string('business_id', 64);
            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->date('day');
            $table->string('kind', 16); // view | book | phone | whatsapp | directions
            $table->unsignedInteger('taps')->default(0);
            $table->unique(['business_id', 'day', 'kind']);
        });

        Schema::create('business_members', function (Blueprint $table) {
            $table->id();
            // The main salon (the account).
            $table->string('business_id', 64)->index();
            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            // One branch, or null for every location.
            $table->string('branch_id', 64)->nullable();
            $table->string('user_id', 26)->nullable()->index();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            // Lowercased email the invite was sent to; matched when that person signs in.
            $table->string('email', 191);
            $table->string('role', 16)->default('manager');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
            $table->unique(['business_id', 'email']);
        });

        Schema::create('waitlist_entries', function (Blueprint $table) {
            $table->string('id', 26)->primary();
            $table->string('business_id', 64);
            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->string('user_id', 26)->index();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('master_id', 64)->nullable();
            $table->json('service_ids');
            $table->date('date');
            $table->unsignedSmallInteger('from_min')->default(0);
            $table->unsignedSmallInteger('to_min')->default(1440);
            $table->timestamp('notified_at')->nullable();
            $table->timestamps();
            $table->index(['business_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waitlist_entries');
        Schema::dropIfExists('business_members');
        Schema::dropIfExists('salon_clicks');
        Schema::dropIfExists('review_codes');
        Schema::table('reviews', fn (Blueprint $t) => $t->dropColumn(['source', 'master_rating']));
        Schema::table('payments', function (Blueprint $t) {
            $t->dropIndex(['booking_id']);
            $t->dropColumn(['kind', 'booking_id', 'user_id', 'locations', 'refunded_at']);
        });
        Schema::table('bookings', function (Blueprint $t) {
            $t->dropIndex(['status', 'hold_until']);
            $t->dropColumn(['deposit', 'deposit_status', 'hold_until']);
        });
        Schema::table('services', fn (Blueprint $t) => $t->dropColumn(['deposit_type', 'deposit_value']));
        Schema::table('masters', fn (Blueprint $t) => $t->dropColumn(['review_weight', 'review_weighted_sum']));
        Schema::table('businesses', function (Blueprint $t) {
            $t->dropIndex(['parent_id']);
            $t->dropColumn(['parent_id', 'booking_url', 'whatsapp_quota', 'whatsapp_used', 'whatsapp_until', 'review_weight', 'review_weighted_sum']);
        });
    }
};
