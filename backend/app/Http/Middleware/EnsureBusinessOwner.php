<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use App\Services\BusinessAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Every /business route acts on one location the user may run: the owner's
 * salon, or on Pro one of its branches, or a location a manager was given.
 * The X-Branch header picks the location; without it, the main salon.
 * Sets the request attributes business (the location), account (the main
 * salon, which holds the plan) and business_role (owner | manager).
 */
class EnsureBusinessOwner
{
    public function __construct(private BusinessAccess $access) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $id = $request->header('X-Branch');
        $row = $user ? $this->access->resolve($user, is_string($id) && $id !== '' ? mb_substr($id, 0, 64) : null) : null;
        if (! $row) {
            throw $id ? ApiException::forbidden('You can’t manage this location.') : ApiException::forbidden('You don’t have a business account.');
        }
        $request->attributes->set('business', $row['business']);
        $request->attributes->set('account', $row['business']->account());
        $request->attributes->set('business_role', $row['role']);
        $request->attributes->set('business_member', $row['member']);

        return $next($request);
    }
}
