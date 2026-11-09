<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

/**
 * A per-weekday timetable as the API takes it: 7 entries (0 = Sunday), each
 * {<from>: "HH:MM", <to>: "HH:MM"} or null for a day off. Used for opening
 * hours (open/close) and masters' schedules (start/end).
 */
class Week
{
    /** Validation rules for the field. */
    public static function rules(string $field, string $from, string $to): array
    {
        $clock = ['regex:/^([01]\d|2[0-3]):[0-5]\d$/'];

        return [
            $field => ['sometimes', 'nullable', 'array', 'size:7'],
            "{$field}.*" => ['present', 'nullable', 'array'],
            "{$field}.*.{$from}" => ['required_with:'.$field.'.*', 'string', ...$clock],
            "{$field}.*.{$to}" => ['required_with:'.$field.'.*', 'string', ...$clock],
        ];
    }

    /**
     * Clean list of 7 entries, each [$from => …, $to => …] or null; throws when a day ends before it starts.
     *
     * @return list<array<string,string>|null>
     */
    public static function normalize(array $week, string $field, string $from, string $to): array
    {
        $out = [];
        for ($d = 0; $d < 7; $d++) {
            $day = $week[$d] ?? null;
            if (! is_array($day)) {
                $out[] = null;

                continue;
            }
            if ($day[$to] <= $day[$from]) {
                throw ValidationException::withMessages(["{$field}.{$d}.{$to}" => ['The end time must be after the start time.']]);
            }
            $out[] = [$from => $day[$from], $to => $day[$to]];
        }

        return $out;
    }

    /**
     * The same week in the old single-pair form, for app versions that only read that:
     * [days off, earliest start, latest end]. Null times when every day is off.
     *
     * @return array{0:list<int>,1:?string,2:?string}
     */
    public static function summary(array $week, string $from, string $to): array
    {
        $off = [];
        $starts = [];
        $ends = [];
        foreach ($week as $d => $day) {
            if ($day === null) {
                $off[] = $d;
            } else {
                $starts[] = $day[$from];
                $ends[] = $day[$to];
            }
        }

        return [$off, $starts ? min($starts) : null, $ends ? max($ends) : null];
    }
}
