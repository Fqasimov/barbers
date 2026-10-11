<?php

namespace App\Support;

/**
 * Multilingual text { az, ru, en }. Owners usually type one language; the
 * missing ones are filled from what they typed (az, then ru, then en).
 */
final class Loc
{
    public const LANGS = ['az', 'ru', 'en'];

    /** Normalises validated input (a string or a partial Loc) for storage. */
    public static function from(mixed $value): ?array
    {
        if ($value === null) {
            return null;
        }
        if (is_string($value)) {
            $value = trim($value);

            return $value === '' ? null : self::fill(['az' => $value]);
        }
        if (! is_array($value)) {
            return null;
        }
        $clean = [];
        foreach (self::LANGS as $lang) {
            $v = isset($value[$lang]) && is_string($value[$lang]) ? trim($value[$lang]) : '';
            if ($v !== '') {
                $clean[$lang] = $v;
            }
        }

        return $clean === [] ? null : self::fill($clean);
    }

    /** Every key present; missing languages take the first one that exists. */
    public static function fill(?array $value, string $fallback = ''): array
    {
        $value ??= [];
        $first = $fallback;
        foreach (self::LANGS as $lang) {
            if (isset($value[$lang]) && $value[$lang] !== '') {
                $first = (string) $value[$lang];
                break;
            }
        }
        $out = [];
        foreach (self::LANGS as $lang) {
            $out[$lang] = isset($value[$lang]) && $value[$lang] !== '' ? (string) $value[$lang] : $first;
        }

        return $out;
    }

    public static function orNull(?array $value): ?array
    {
        return $value ? self::fill($value) : null;
    }

    public static function make(string $az, string $ru, string $en): array
    {
        return ['az' => $az, 'ru' => $ru, 'en' => $en];
    }
}
