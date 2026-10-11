<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies;

/** TRUSTED_PROXIES ("*" or a comma list), read from config so it works with config:cache. */
class TrustProxiesFromConfig extends TrustProxies
{
    protected function proxies()
    {
        $value = trim((string) config('usta.trusted_proxies', ''));
        if ($value === '') {
            return parent::proxies();
        }

        return $value === '*' ? '*' : array_map('trim', explode(',', $value));
    }
}
