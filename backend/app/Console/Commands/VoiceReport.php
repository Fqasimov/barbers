<?php

namespace App\Console\Commands;

use App\Models\Business;
use App\Support\Baku;
use Illuminate\Console\Command;

/** The month's voice assistant bill for every salon: pack, minutes used, extra minutes, what to charge. */
class VoiceReport extends Command
{
    protected $signature = 'usta:voice-report {--month= : YYYY-MM, default this month}';

    protected $description = 'Voice assistant minutes and extra charges per salon for a month';

    public function handle(): int
    {
        $month = $this->option('month') ? Baku::date($this->option('month').'-01') : Baku::now();
        $packs = config('usta.voice.packs');
        $rows = Business::query()->whereNull('parent_id')->whereNotNull('voice_minutes')->orderBy('name')->get()
            ->map(function (Business $b) use ($month, $packs) {
                $u = $b->voiceUsage($month);

                return [
                    $b->name, $b->id, $u['pack'], $u['used'], $u['extra'],
                    number_format($packs[$u['pack']] ?? 0, 2), number_format($u['owed'], 2),
                    number_format(($packs[$u['pack']] ?? 0) + $u['owed'], 2), $u['capped'] ? 'cap reached' : '',
                ];
            });
        $this->info('Voice assistant, '.$month->format('Y-m'));
        $this->table(['Salon', 'Id', 'Pack', 'Used', 'Extra', 'Pack ₼', 'Extra ₼', 'Total ₼', ''], $rows->all());

        return self::SUCCESS;
    }
}
