<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Versions the cached GET /busy payloads. Any booking change bumps the version,
 * so the next request recomputes instead of serving a schedule that is up to
 * 30 seconds stale.
 */
final class BusyCache
{
    private const VERSION_KEY = 'catalogue:busy:version';

    public static function version(): string
    {
        return (string) Cache::get(self::VERSION_KEY, '0');
    }

    public static function flush(): void
    {
        Cache::forever(self::VERSION_KEY, bin2hex(random_bytes(6)));
    }
}
