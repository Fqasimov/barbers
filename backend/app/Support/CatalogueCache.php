<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/** The cached GET /salons payload; dropped whenever catalogue data changes. */
final class CatalogueCache
{
    public const KEY = 'catalogue:salons:v1';

    public const TTL = 60;

    private const VERSION_KEY = 'catalogue:version';

    public static function flush(): void
    {
        Cache::forget(self::KEY);
        Cache::forever(self::VERSION_KEY, bin2hex(random_bytes(6)));
    }

    /** Changes with every flush; part of the key of other cached catalogue answers. */
    public static function version(): string
    {
        return (string) Cache::get(self::VERSION_KEY, '0');
    }
}
