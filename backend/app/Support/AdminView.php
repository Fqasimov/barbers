<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/** Formatting for the admin panel's views. Times are Baku time. */
final class AdminView
{
    public static function dt(CarbonInterface|string|null $t): string
    {
        return ($t = self::time($t)) ? Baku::local($t)->format('d.m.Y H:i') : '—';
    }

    public static function date(CarbonInterface|string|null $t): string
    {
        return ($t = self::time($t)) ? Baku::local($t)->format('d.m.Y') : '—';
    }

    public static function ago(CarbonInterface|string|null $t): string
    {
        return ($t = self::time($t)) ? $t->diffForHumans(short: true) : '—';
    }

    private static function time(CarbonInterface|string|null $t): ?CarbonInterface
    {
        return is_string($t) && $t !== '' ? CarbonImmutable::parse($t, 'UTC') : ($t ?: null);
    }

    public static function money(int|float|null $amount): string
    {
        return number_format((float) $amount, 0, ',', ' ').' ₼';
    }

    /** A {az, ru, en} value (or a plain string): Azerbaijani first. */
    public static function loc(mixed $v): string
    {
        if (is_array($v)) {
            return (string) ($v['az'] ?? $v['en'] ?? reset($v) ?: '');
        }

        return (string) $v;
    }

    public static function initials(string $name): string
    {
        $parts = preg_split('/\s+/u', trim($name)) ?: [];

        return mb_strtoupper(implode('', array_map(fn ($p) => mb_substr($p, 0, 1), array_slice($parts, 0, 2))));
    }
}
