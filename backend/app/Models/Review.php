<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Support\CatalogueCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasStringId;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'service_name' => 'array',
            'rating' => 'integer',
            'hidden_at' => 'datetime',
            'replied_at' => 'datetime',
            'report_count' => 'integer',
        ];
    }

    /** Reviews everyone can see: not hidden by moderation. */
    public function scopeVisible(Builder $query): void
    {
        $query->whereNull('hidden_at');
    }

    protected static function booted(): void
    {
        static::saved(fn () => CatalogueCache::flush());
        static::deleted(fn () => CatalogueCache::flush());
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class)->withTrashed();
    }
}
