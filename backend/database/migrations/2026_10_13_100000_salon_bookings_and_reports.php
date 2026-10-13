<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // visit: a client's appointment. block: time the salon closed off (break, day off, holiday).
            $table->string('kind', 8)->default('visit')->after('business_id');
            // customer: booked in the app. salon: added by the salon (phone call, walk-in).
            $table->string('source', 10)->default('customer')->after('kind');
            // Clients the salon adds by hand have no account.
            $table->string('client_name', 80)->nullable()->after('user_id');
            $table->string('client_phone', 20)->nullable()->after('client_name');
            $table->index(['business_id', 'status', 'end_at']);
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->timestamp('hidden_at')->nullable()->after('service_name');
            $table->unsignedInteger('report_count')->default(0)->after('hidden_at');
            // The salon's public answer.
            $table->text('reply')->nullable()->after('report_count');
            $table->timestamp('replied_at')->nullable()->after('reply');
        });

        Schema::create('review_reports', function (Blueprint $table) {
            $table->id();
            $table->string('review_id', 64)->index();
            $table->foreign('review_id')->references('id')->on('reviews')->cascadeOnDelete();
            $table->string('user_id', 26)->nullable();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->string('reason', 16); // spam | offensive | fake | other
            $table->string('note', 500)->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->unique(['review_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_reports');
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn(['hidden_at', 'report_count', 'reply', 'replied_at']);
        });
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['business_id', 'status', 'end_at']);
            $table->dropColumn(['kind', 'source', 'client_name', 'client_phone']);
        });
    }
};
