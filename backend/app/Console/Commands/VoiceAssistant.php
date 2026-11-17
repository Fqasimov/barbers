<?php

namespace App\Console\Commands;

use App\Models\Business;
use Illuminate\Console\Command;

/** Turns the voice assistant add-on on (for N days) or off for a salon, until it can be bought in the app. */
class VoiceAssistant extends Command
{
    protected $signature = 'usta:voice {id : The salon id} {--days=30 : How many days it runs} {--off : Turn it off}';

    protected $description = 'Turn the voice assistant add-on on or off for a salon';

    public function handle(): int
    {
        $b = Business::query()->find($this->argument('id'))?->account();
        if (! $b) {
            $this->error('No such business.');

            return self::FAILURE;
        }
        if ($this->option('off')) {
            $b->forceFill(['voice_until' => null])->save();
            $this->info("Voice assistant off for {$b->name}.");

            return self::SUCCESS;
        }
        if (! $b->takesBookings()) {
            $this->error('This salon’s plan doesn’t take bookings (Sadə). It needs Fərdi, Start or Pro.');

            return self::FAILURE;
        }
        $from = $b->voice_until && $b->voice_until->isFuture() ? $b->voice_until : now();
        $b->forceFill(['voice_until' => $from->copy()->addDays((int) $this->option('days'))])->save();
        $this->info("Voice assistant on for {$b->name} until {$b->voice_until->toDateString()}.");
        $this->line("Agent tool URLs: ".rtrim((string) config('app.url'), '/')."/api/voice/{$b->id}/info | check | book");

        return self::SUCCESS;
    }
}
