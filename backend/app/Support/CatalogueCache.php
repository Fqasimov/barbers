<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/** The cached GET /salons payload; dropped whenever catalogue data changes. */
final class CatalogueCache
{
    public const KEY = 'catalogue:salons:v1';

    public const TTL = 60;

    public static function flush(): void
    {
        Cache::forget(self::KEY);
    }
}
