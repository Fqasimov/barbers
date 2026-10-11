<?php

namespace App\Console\Commands;

use App\Models\Business;
use Illuminate\Console\Command;

class SuspendBusiness extends Command
{
    protected $signature = 'usta:suspend-business {id : The business (salon) id}';

    protected $description = 'Suspend a business: hidden from search, existing bookings stay';

    public function handle(): int
    {
        $b = Business::query()->find($this->argument('id'));
        if (! $b) {
            $this->error('No such business.');

            return self::FAILURE;
        }
        $b->forceFill(['status' => Business::SUSPENDED])->save();
        $this->info("{$b->name} ({$b->id}) is suspended.");

        return self::SUCCESS;
    }
}
