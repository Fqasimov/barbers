<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/** /admin pages: a signed-in, enabled admin, active within the idle timeout. */
class AdminAuthenticate
{
    public const IDLE_MINUTES = 30;

    public function handle(Request $request, Closure $next): Response
    {
        $guard = Auth::guard('admin');
        $admin = $guard->user();
        $seen = (int) $request->session()->get('admin_seen', 0);

        if (! $admin || $admin->disabled_at || ($seen && $seen < now()->subMinutes(self::IDLE_MINUTES)->getTimestamp())) {
            $expired = (bool) $admin;
            $guard->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->guest(route('admin.login'))->with('status', $expired ? 'Signed out after '.self::IDLE_MINUTES.' minutes without activity.' : null);
        }
        $request->session()->put('admin_seen', now()->getTimestamp());

        return $next($request);
    }
}
