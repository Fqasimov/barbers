<?php

namespace App\Support;

use App\Models\Attendance;
use App\Models\Master;

/** One attendance record as the API sends it, with the shift planned that day for comparison. */
class AttendanceRow
{
    /** Minutes of grace before a check-in counts as late. */
    public const GRACE = 10;

    public static function make(Attendance $a, ?Master $master = null): array
    {
        $master ??= $a->master;
        $in = Baku::local($a->check_in_at);
        $out = $a->check_out_at ? Baku::local($a->check_out_at) : null;
        $shift = $master?->dayShift($in->dayOfWeek);
        $late = $shift ? max(0, Baku::minutesOfDay($in) - Baku::minutes($shift[0])) : 0;

        return [
            'id' => $a->id,
            'master_id' => $a->master_id,
            'master_name' => $master?->name,
            'day' => $in->toDateString(),
            'check_in_at' => Iso::ts($a->check_in_at),
            'check_out_at' => Iso::ts($a->check_out_at),
            'minutes' => $out ? (int) floor(($out->getTimestamp() - $in->getTimestamp()) / 60) : null,
            'shift' => $shift ? ['start' => $shift[0], 'end' => $shift[1]] : null,
            'late_minutes' => $late > self::GRACE ? $late : 0,
        ];
    }
}
