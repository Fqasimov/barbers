<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Voice assistant minutes: each salon's monthly pack, its ElevenLabs agent, and every call's length. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->unsignedInteger('voice_minutes')->nullable()->after('voice_until');
            $table->string('voice_agent_id', 80)->nullable()->unique()->after('voice_minutes');
        });
        Schema::create('voice_calls', function (Blueprint $table) {
            $table->id();
            $table->string('business_id', 64)->index();
            $table->string('conversation_id', 120)->unique();
            $table->timestamp('started_at')->index();
            $table->unsignedInteger('seconds');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voice_calls');
        Schema::table('businesses', fn (Blueprint $t) => $t->dropColumn(['voice_minutes', 'voice_agent_id']));
    }
};
