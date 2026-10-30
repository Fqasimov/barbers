<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Usta staff. Separate from app users: no app account can become an admin.
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('email')->unique();
            $table->string('password');
            $table->text('totp_secret'); // encrypted
            $table->unsignedBigInteger('totp_last_step')->nullable(); // a code works once
            $table->timestamp('last_login_at')->nullable();
            $table->timestamp('disabled_at')->nullable();
            $table->timestamps();
        });

        // Every change made in the admin panel.
        Schema::create('admin_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->string('action', 40);
            $table->string('subject_type', 20)->nullable();
            $table->string('subject_id', 64)->nullable();
            $table->string('summary', 255);
            $table->json('data')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->index();
            $table->index(['subject_type', 'subject_id']);
        });

        Schema::table('businesses', function (Blueprint $table) {
            $table->timestamp('suspended_at')->nullable()->after('approved_at');
            $table->string('suspended_reason', 255)->nullable()->after('suspended_at');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', fn (Blueprint $table) => $table->dropColumn(['suspended_at', 'suspended_reason']));
        Schema::dropIfExists('admin_actions');
        Schema::dropIfExists('admins');
    }
};
