<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** /api answers are data, never pages: no sniffing, no framing, no referrer, HTTPS only once served over it. */
class ApiSecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $h = $response->headers;
        $h->set('X-Content-Type-Options', 'nosniff');
        $h->set('X-Frame-Options', 'DENY');
        $h->set('Referrer-Policy', 'no-referrer');
        $h->set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
        if ($request->isSecure()) {
            $h->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        $h->remove('X-Powered-By');
        if (! $h->has('Cache-Control') || ! str_contains((string) $h->get('Cache-Control'), 'public')) {
            // Personal answers (bookings, account) are never stored by shared caches.
            $h->set('Cache-Control', 'no-store, private');
        }

        return $response;
    }
}
