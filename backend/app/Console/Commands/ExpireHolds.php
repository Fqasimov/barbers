<?php

namespace App\Console\Commands;

use App\Services\BookingService;
use Illuminate\Console\Command;

/** Deposit bookings not paid within the hold: cancelled, the time goes back to everyone. */
class ExpireHolds extends Command
{
    protected $signature = 'usta:expire-holds';

    protected $description = 'Release slots of unpaid deposit bookings (run every minute)';

    public function handle(BookingService $bookings): int
    {
        $this->info('Released '.$bookings->expireHolds().' unpaid holds.');

        return self::SUCCESS;
    }
}
