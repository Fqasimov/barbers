<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/** Clock-time helpers in the venue time zone (Asia/Baku). */
final class Baku
{
    public static function tz(): string
    {
        return config('usta.timezone');
    }

    public static function now(): CarbonImmutable
    {
        return CarbonImmutable::now(self::tz());
    }

    public static function today(): CarbonImmutable
    {
        return self::now()->startOfDay();
    }

    /** 'YYYY-MM-DD' → Baku midnight. */
    public static function date(string $ymd): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat('!Y-m-d', $ymd, self::tz());
    }

    public static function local(CarbonInterface $t): CarbonImmutable
    {
        return CarbonImmutable::instance($t)->setTimezone(self::tz());
    }

    /** '09:30' → 570 */
    public static function minutes(string $hhmm): int
    {
        [$h, $m] = array_map('intval', explode(':', $hhmm));

        return $h * 60 + $m;
    }

    public static function minutesOfDay(CarbonInterface $t): int
    {
        $l = self::local($t);

        return $l->hour * 60 + $l->minute;
    }
}
