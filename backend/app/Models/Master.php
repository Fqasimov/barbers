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
            'languages' => 'array',
            'years' => 'integer',
            'base_rating' => 'float',
            'base_review_count' => 'integer',
            'review_count' => 'integer',
            'review_sum' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn () => CatalogueCache::flush());
        static::deleted(fn () => CatalogueCache::flush());
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
