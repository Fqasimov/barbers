<?php

namespace App\Services;

use App\Jobs\SendPush;
use App\Models\Booking;
use App\Models\Business;
use App\Models\WaitlistEntry;
use App\Support\Baku;

/**
 * Pro salons: a client asks to hear when a time opens on a day. When a
 * booking on that day is cancelled (or a deposit hold runs out), everyone
 * waiting whose services now fit gets one push. First to book gets it.
 */
class Waitlist
{
    public function __construct(private Availability $availability) {}

    public function slotFreed(Booking $freed): int
    {
        if ($freed->isBlock() || $freed->start_at->isPast()) {
            return 0;
        }
        $salon = Business::query()->bookable()->with(['services', 'masters.services'])->find($freed->business_id);
        if (! $salon || ! $salon->hasFeature('waitlist')) {
            return 0;
        }
        $date = Baku::local($freed->start_at)->startOfDay();
        $entries = WaitlistEntry::query()->where('business_id', $salon->id)
            ->where('date', $date->toDateString())->whereNull('notified_at')
            ->where(fn ($q) => $q->whereNull('master_id')->orWhere('master_id', $freed->master_id))
            ->orderBy('created_at')->get();
        $sent = 0;
        foreach ($entries as $entry) {
            $first = $this->firstFit($salon, $entry, $date);
            if ($first === null) {
                continue;
            }
            $time = sprintf('%02d:%02d', intdiv($first, 60), $first % 60);
            dispatch(new SendPush($entry->user_id,
                'Vaxt boşaldı · Освободилось время · A time opened',
                "{$salon->name} · {$date->format('d.m')} {$time}",
                ['type' => 'waitlist', 'salon_id' => $salon->id, 'url' => '/salon/'.$salon->id]));
            $entry->forceFill(['notified_at' => now()])->save();
            $sent++;
        }

        return $sent;
    }

    /** The earliest free start (minutes of the day) for the entry's services within its window. */
    public function firstFit(Business $salon, WaitlistEntry $entry, $date): ?int
    {
        $ids = array_values($entry->service_ids ?? []);
        $services = $salon->services->whereIn('id', $ids);
        if ($services->count() !== count($ids) || $ids === []) {
            return null;
        }
        $duration = (int) $services->sum('duration_min');
        $masters = $entry->master_id
            ? $salon->masters->where('id', $entry->master_id)->filter(fn ($m) => $m->doesAll($ids))
            : $this->availability->eligible($salon, $ids);
        $busy = $this->availability->busy($masters->pluck('id')->all(), $date, $date->addDay());
        $best = null;
        foreach ($masters as $m) {
            foreach ($this->availability->day($salon, $m, $date, $duration, $busy[$m->id] ?? [])['slots'] as $t) {
                if ($t >= $entry->from_min && $t <= $entry->to_min) {
                    $best = $best === null ? $t : min($best, $t);
                    break;
                }
            }
        }

        return $best;
    }
}
