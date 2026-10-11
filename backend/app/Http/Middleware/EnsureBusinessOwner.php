<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use App\Models\Business;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Every /business route acts on the signed-in owner's own business. */
class EnsureBusinessOwner
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $business = $user ? Business::query()->where('owner_id', $user->id)->first() : null;
        if (! $business) {
            throw ApiException::forbidden('You don’t have a business account.');
        }
        $request->attributes->set('business', $business);

        return $next($request);
    }
}
