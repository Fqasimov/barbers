<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Business;
use App\Models\Master;
use App\Support\Baku;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Free start times, computed the same way as the app (src/data/availability.ts):
 *  - window = master shift ∩ salon hours; none on closed days or days off
 *  - candidates every 30 min from the window start; start + duration ≤ end
 *  - no overlap with the master's `upcoming` bookings
 *  - same-day starts at least 30 min from now; bookable 7 days ahead incl. today
 * (The app's synthetic "existing appointments" are replaced by real bookings.)
 */
class Availability
{
    /** @return array{0:int,1:int}|null minutes after midnight */
    public function window(Business $salon, Master $master, CarbonImmutable $date): ?array
    {
        $dow = $date->dayOfWeek; // 0 = Sunday
        $closed = array_map('intval', $salon->closed_days ?? []);
        $works = array_map('intval', $master->work_days ?? []);
        if (in_array($dow, $closed, true) || ! in_array($dow, $works, true)) {
            return null;
        }
        $start = max(Baku::minutes($master->shift_start), Baku::minutes($salon->hours_open));
        $end = min(Baku::minutes($master->shift_end), Baku::minutes($salon->hours_close));

        return $end > $start ? [$start, $end] : null;
    }

    /** Whether a Baku date is inside the booking window (today … today + 6). */
    public function bookableDate(CarbonImmutable $date, ?CarbonImmutable $now = null): bool
    {
        $today = ($now ?? Baku::now())->setTimezone(Baku::tz())->startOfDay();

        return $date->gte($today) && $date->lt($today->addDays(config('usta.availability.window_days')));
    }

    /**
     * Upcoming bookings of these masters overlapping [from, to), as
     * master_id => list of [startTs, endTs] (unix seconds).
     *
     * @param  list<string>  $masterIds
     * @return array<string, list<array{0:int,1:int}>>
     */
    public function busy(array $masterIds, CarbonImmutable $from, CarbonImmutable $to, ?string $exceptBookingId = null): array
    {
        if ($masterIds === []) {
            return [];
        }
        $rows = Booking::query()
            ->whereIn('master_id', $masterIds)
            ->where('status', Booking::UPCOMING)
            ->where('start_at', '<', $to->utc())
            ->where('end_at', '>', $from->utc())
            ->when($exceptBookingId, fn ($q) => $q->whereKeyNot($exceptBookingId))
            ->get(['master_id', 'start_at', 'end_at']);

        $out = [];
        foreach ($rows as $b) {
            $out[$b->master_id][] = [$b->start_at->getTimestamp(), $b->end_at->getTimestamp()];
        }

        return $out;
    }

    /**
     * @param  list<array{0:int,1:int}>  $busy
     * @return array{date:string, off:bool, slots:list<int>}
     */
    public function day(Business $salon, Master $master, CarbonImmutable $date, int $duration, array $busy, ?CarbonImmutable $now = null, bool $ignoreBusy = false): array
    {
        $now = ($now ?? Baku::now())->setTimezone(Baku::tz());
        $date = $date->setTimezone(Baku::tz())->startOfDay();
        $window = $this->window($salon, $master, $date);
        if (! $window) {
            return ['date' => $date->toDateString(), 'off' => true, 'slots' => []];
        }
        if (! $this->bookableDate($date, $now) || $duration <= 0) {
            return ['date' => $date->toDateString(), 'off' => false, 'slots' => []];
        }

        $step = config('usta.availability.slot_step');
        $earliest = $date->isSameDay($now) ? $now->hour * 60 + $now->minute + config('usta.availability.lead_minutes') : PHP_INT_MIN;
        $base = $date->getTimestamp();
        $slots = [];
        for ($t = $window[0]; $t + $duration <= $window[1]; $t += $step) {
            if ($t < $earliest) {
                continue;
            }
            $s = $base + $t * 60;
            $e = $s + $duration * 60;
            if (! $ignoreBusy) {
                foreach ($busy as [$bs, $be]) {
                    if ($bs < $e && $s < $be) {
                        continue 2;
                    }
                }
            }
            $slots[] = $t;
        }

        return ['date' => $date->toDateString(), 'off' => false, 'slots' => $slots];
    }

    /**
     * @param  Collection<int, Master>  $masters
     * @return list<array{master_id:string, days:list<array>}>
     */
    public function schedules(Business $salon, Collection $masters, CarbonImmutable $from, int $days, int $duration): array
    {
        $from = $from->setTimezone(Baku::tz())->startOfDay();
        $to = $from->addDays($days);
        $busy = $this->busy($masters->pluck('id')->all(), $from, $to);
        $now = Baku::now();

        return $masters->map(fn (Master $m) => [
            'master_id' => $m->id,
            'days' => array_map(
                fn ($i) => $this->day($salon, $m, $from->addDays($i), $duration, $busy[$m->id] ?? [], $now),
                range(0, $days - 1),
            ),
        ])->values()->all();
    }

    /** Masters able to perform every selected service. */
    public function eligible(Business $salon, array $serviceIds): Collection
    {
        return $salon->masters->filter(fn (Master $m) => $m->doesAll($serviceIds))->values();
    }
}
