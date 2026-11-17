<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** The voice assistant add-on: an ElevenLabs agent that answers the salon's missed calls and books. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->timestamp('voice_until')->nullable()->after('whatsapp_until');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', fn (Blueprint $t) => $t->dropColumn('voice_until'));
    }
};
