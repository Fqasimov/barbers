<?php

namespace App\Console\Commands;

use App\Models\Business;
use Illuminate\Console\Command;

/**
 * Sets up a salon's voice assistant: its monthly pack of minutes, its ElevenLabs agent, and how
 * long it runs. Until it can be bought in the app, the salon pays and this turns it on.
 */
class VoiceAssistant extends Command
{
    protected $signature = 'usta:voice {id : The salon id}
        {--minutes= : Monthly pack: 100, 250 or 500 minutes}
        {--agent= : The salon\'s ElevenLabs agent id}
        {--days=30 : How many days it runs}
        {--off : Turn it off}';

    protected $description = 'Turn the voice assistant on or off for a salon, with its monthly minutes';

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
        $packs = config('usta.voice.packs');
        $minutes = $this->option('minutes') !== null ? (int) $this->option('minutes') : $b->voice_minutes;
        if (! $minutes || ! array_key_exists($minutes, $packs)) {
            $this->error('Pick a pack with --minutes: '.implode(', ', array_keys($packs)).'.');

            return self::FAILURE;
        }
        $agent = $this->option('agent') ?? $b->voice_agent_id;
        if (! $agent) {
            $this->error('Give the salon’s ElevenLabs agent id with --agent (Agents → the agent → its id).');

            return self::FAILURE;
        }
        if (Business::query()->where('voice_agent_id', $agent)->whereKeyNot($b->id)->exists()) {
            $this->error('That agent already belongs to another salon.');

            return self::FAILURE;
        }
        $from = $b->voice_until && $b->voice_until->isFuture() ? $b->voice_until : now();
        $b->forceFill([
            'voice_until' => $from->copy()->addDays((int) $this->option('days')),
            'voice_minutes' => $minutes,
            'voice_agent_id' => $agent,
        ])->save();

        $cap = (int) floor($minutes * (float) config('usta.voice.cap'));
        $this->info("Voice assistant on for {$b->name} until {$b->voice_until->toDateString()}.");
        $this->line("Pack: {$minutes} min a month for {$packs[$minutes]} ₼; extra minutes ".config('usta.voice.extra_price')." ₼ each, up to {$cap} min.");
        $this->line('Tools: '.rtrim((string) config('app.url'), '/')."/api/voice/{$b->id}/info | check | book");

        return self::SUCCESS;
    }
}
