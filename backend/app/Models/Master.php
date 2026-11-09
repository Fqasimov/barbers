<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Support\CatalogueCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Master extends Model
{
    use HasStringId;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'role' => 'array',
            'work_days' => 'array',
            'schedule' => 'array',
            'languages' => 'array',
            'years' => 'integer',
            'base_rating' => 'float',
            'base_review_count' => 'integer',
            'review_count' => 'integer',
            'review_sum' => 'integer',
            'review_weight' => 'integer',
            'review_weighted_sum' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn () => CatalogueCache::flush());
        static::deleted(fn () => CatalogueCache::flush());
    }

    /**
     * The shift on a weekday (0 = Sunday) as [start, end] "HH:MM", or null on a day off.
     * A per-day schedule wins; otherwise work_days + the one shift.
     *
     * @return array{0:string,1:string}|null
     */
    public function dayShift(int $dow): ?array
    {
        $week = $this->schedule;
        if (is_array($week) && count($week) === 7) {
            $d = $week[$dow] ?? null;

            return is_array($d) && isset($d['start'], $d['end']) ? [$d['start'], $d['end']] : null;
        }
        if (! in_array($dow, array_map('intval', $this->work_days ?? []), true)) {
            return null;
        }

        return [$this->shift_start, $this->shift_end];
    }

    /** The full week as the API sends it: 7 entries, {start, end} or null. */
    public function weekSchedule(): array
    {
        return array_map(function ($dow) {
            $s = $this->dayShift($dow);

            return $s ? ['start' => $s[0], 'end' => $s[1]] : null;
        }, range(0, 6));
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class)->orderBy('services.position')->orderBy('services.created_at');
    }

    /** @return list<string> */
    public function serviceIds(): array
    {
        return $this->services->pluck('id')->values()->all();
    }

    /** @param  list<string>  $serviceIds */
    public function doesAll(array $serviceIds): bool
    {
        return array_diff($serviceIds, $this->serviceIds()) === [];
    }
}
