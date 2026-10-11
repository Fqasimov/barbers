<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Support\CatalogueCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Service extends Model
{
    use HasStringId;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'name' => 'array',
            'description' => 'array',
            'duration_min' => 'integer',
            'price' => 'integer',
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

    public function masters(): BelongsToMany
    {
        return $this->belongsToMany(Master::class);
    }
}
