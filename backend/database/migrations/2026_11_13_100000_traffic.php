<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Website traffic read from the web server's access log (usta:ingest-traffic). */
return new class extends Migration
{
    public function up(): void
    {
        // Per Baku day: page views and distinct visitors (people), and requests from bots.
        Schema::create('traffic_days', function (Blueprint $t) {
            $t->date('day')->primary();
            $t->unsignedInteger('views')->default(0);
            $t->unsignedInteger('visitors')->default(0);
            $t->unsignedInteger('bots')->default(0);
        });
        // Who visited on a day, as a hash (never the address), only to count distinct visitors.
        Schema::create('traffic_visitors', function (Blueprint $t) {
            $t->date('day');
            $t->char('hash', 40);
            $t->primary(['day', 'hash']);
        });
        // Top pages and where visitors came from.
        Schema::create('traffic_counts', function (Blueprint $t) {
            $t->date('day');
            $t->string('kind', 8); // page | ref
            $t->string('key', 190);
            $t->unsignedInteger('n')->default(0);
            $t->primary(['day', 'kind', 'key']);
        });
        // Addresses that probe for weak spots, hammer the admin sign-in or hit many missing pages.
        Schema::create('traffic_ips', function (Blueprint $t) {
            $t->string('ip', 45)->primary();
            $t->unsignedInteger('hits')->default(0);
            $t->unsignedInteger('probes')->default(0);
            $t->unsignedInteger('not_found')->default(0);
            $t->unsignedInteger('admin_posts')->default(0);
            $t->string('sample', 190)->nullable();
            $t->string('agent', 190)->nullable();
            $t->boolean('flagged')->default(false)->index();
            $t->timestamp('first_seen')->nullable();
            $t->timestamp('last_seen')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('traffic_ips');
        Schema::dropIfExists('traffic_counts');
        Schema::dropIfExists('traffic_visitors');
        Schema::dropIfExists('traffic_days');
    }
};
