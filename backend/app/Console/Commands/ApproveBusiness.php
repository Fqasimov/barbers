<?php

namespace App\Console\Commands;

use App\Models\Business;
use Illuminate\Console\Command;

class ApproveBusiness extends Command
{
    protected $signature = 'usta:approve-business {id : The business (salon) id}';

    protected $description = 'Approve a business after review: status → live';

    public function handle(): int
    {
        $b = Business::query()->find($this->argument('id'));
        if (! $b) {
            $this->error('No such business.');

            return self::FAILURE;
        }
        $b->forceFill(['status' => Business::LIVE, 'approved_at' => $b->approved_at ?? now()])->save();
        $this->info("{$b->name} ({$b->id}) is live.");
        if (! $b->isListable()) {
            $this->warn('It is not in search yet: it needs at least one service and master, and a trial or paid plan.');
        }

        return self::SUCCESS;
    }
}
