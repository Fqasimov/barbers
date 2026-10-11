<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('one_time_codes', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->string('purpose', 16); // register | reset
            $table->string('code_hash', 64); // HMAC-SHA256, never the code itself
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('resend_at');
            $table->timestamps();
            $table->unique(['email', 'purpose']);
        });

        // A business is also the public salon: businesses.id is the salon id.
        Schema::create('businesses', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('owner_id', 26)->nullable()->index();
            $table->foreign('owner_id')->references('id')->on('users')->nullOnDelete();
            $table->string('name', 120);
            $table->json('kind')->nullable();
            $table->json('categories');
            $table->json('tagline')->nullable();
            $table->json('about')->nullable();
            $table->string('address')->default('');
            $table->string('district', 120)->default('');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->unsignedTinyInteger('price_level')->nullable();
            $table->string('tone', 16)->nullable();
            $table->string('audience', 8)->default('all');
            $table->string('hours_open', 5)->default('09:00');
            $table->string('hours_close', 5)->default('20:00');
            $table->json('closed_days');
            $table->string('phone', 32)->default('');
            $table->string('whatsapp', 20)->default('');
            $table->json('amenities')->nullable();
            // Aggregates imported with seeded venues; real reviews are added on top.
            $table->decimal('base_rating', 4, 3)->default(0);
            $table->unsignedInteger('base_review_count')->default(0);
            $table->json('base_distribution')->nullable();
            // Denormalised from the reviews table (RatingService).
            $table->unsignedInteger('review_count')->default(0);
            $table->unsignedInteger('review_sum')->default(0);
            $table->json('review_stars')->nullable(); // counts for 5★ … 1★
            $table->string('status', 16)->default('pending_review')->index();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->string('business_id', 64)->unique();
            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->string('plan', 16);
            $table->string('status', 16)->index(); // trialing | active | past_due | expired
            $table->timestamp('started_at');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('trial_reminded_3d_at')->nullable();
            $table->timestamp('trial_reminded_0d_at')->nullable();
            $table->timestamps();
        });

        Schema::create('masters', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('business_id', 64)->index();
            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->string('name', 80);
            $table->json('role');
            $table->unsignedTinyInteger('years')->default(0);
            $table->json('work_days');
            $table->string('shift_start', 5);
            $table->string('shift_end', 5);
            $table->string('tone', 16)->nullable();
            $table->json('languages');
            $table->string('photo_path')->nullable();
            $table->decimal('base_rating', 4, 3)->default(0);
            $table->unsignedInteger('base_review_count')->default(0);
            $table->unsignedInteger('review_count')->default(0);
            $table->unsignedInteger('review_sum')->default(0);
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('services', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('business_id', 64)->index();
            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->string('key', 40)->index();
            $table->json('name');
            $table->json('description')->nullable();
            $table->string('category', 16);
            $table->unsignedSmallInteger('duration_min');
            $table->unsignedInteger('price');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('master_service', function (Blueprint $table) {
            $table->string('master_id', 64);
            $table->string('service_id', 64);
            $table->primary(['master_id', 'service_id']);
            $table->foreign('master_id')->references('id')->on('masters')->cascadeOnDelete();
            $table->foreign('service_id')->references('id')->on('services')->cascadeOnDelete();
        });

        Schema::create('bookings', function (Blueprint $table) {
            $table->string('id', 26)->primary();
            $table->string('business_id', 64)->index();
            $table->string('user_id', 26)->nullable()->index();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            // No FK: a booking keeps its master id after the master is removed.
            $table->string('master_id', 64);
            // Snapshot of what was booked: [{id, name, duration_min, price}].
            $table->json('services');
            $table->timestamp('start_at');
            $table->timestamp('end_at');
            $table->unsignedSmallInteger('duration_min');
            $table->unsignedInteger('total');
            $table->text('note')->nullable();
            $table->string('status', 16)->default('upcoming'); // upcoming | completed | cancelled | no_show
            $table->string('cancelled_by', 16)->nullable();
            $table->string('cancel_reason', 500)->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('reminded_24h_at')->nullable();
            $table->timestamp('reminded_2h_at')->nullable();
            $table->timestamps();
            $table->index(['master_id', 'status', 'start_at']);
            $table->index(['status', 'start_at']);
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('business_id', 64)->index();
            $table->string('master_id', 64)->nullable()->index();
            $table->string('user_id', 26)->nullable()->index();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->string('booking_id', 26)->nullable()->unique();
            $table->string('author', 80);
            $table->unsignedTinyInteger('rating');
            $table->text('text');
            $table->json('tags')->nullable();
            $table->json('service_name')->nullable();
            $table->timestamps();
            $table->index(['business_id', 'created_at']);
        });

        Schema::create('photos', function (Blueprint $table) {
            $table->string('id', 26)->primary();
            $table->string('business_id', 64)->index();
            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->string('disk', 32);
            $table->string('path');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('push_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 26)->index();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('token')->unique();
            $table->string('platform', 10);
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('business_id', 64)->nullable()->index();
            $table->string('plan', 16);
            $table->unsignedInteger('amount'); // whole AZN
            $table->string('currency', 3)->default('AZN');
            $table->string('status', 16)->default('pending'); // pending | paid | failed
            $table->string('provider', 32);
            $table->string('provider_ref')->nullable()->index();
            $table->json('raw_callback')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['payments', 'push_tokens', 'photos', 'reviews', 'bookings', 'master_service', 'services', 'masters', 'subscriptions', 'businesses', 'one_time_codes'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
