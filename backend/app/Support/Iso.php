<?php

namespace App\Support;

use Carbon\CarbonInterface;

final class Iso
{
    /** ISO-8601 in UTC with milliseconds, like JavaScript's toISOString(). */
    public static function ts(?CarbonInterface $t): ?string
    {
        return $t?->copy()->utc()->format('Y-m-d\TH:i:s.v\Z');
    }
}
