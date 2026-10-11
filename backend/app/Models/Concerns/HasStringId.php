<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

/**
 * String primary keys. Seeded rows keep their ids ("old-town-barbers.m1");
 * new rows get a lowercase ULID.
 */
trait HasStringId
{
    public function initializeHasStringId(): void
    {
        $this->incrementing = false;
        $this->keyType = 'string';
    }

    protected static function bootHasStringId(): void
    {
        static::creating(function ($model) {
            if (empty($model->getKey())) {
                $model->setAttribute($model->getKeyName(), strtolower((string) Str::ulid()));
            }
        });
    }
}
