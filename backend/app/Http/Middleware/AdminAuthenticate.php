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

        // A new password or authenticator ends every session started with the old ones.
        $stale = $admin && ! hash_equals(self::credentialKey($admin), (string) $request->session()->get('admin_key', ''));

        if (! $admin || $stale || $admin->disabled_at || ($seen && $seen < now()->subMinutes(self::IDLE_MINUTES)->getTimestamp())) {
            $expired = (bool) $admin;
            $guard->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->guest(route('admin.login'))->with('status', $expired ? 'Signed out after '.self::IDLE_MINUTES.' minutes without activity.' : null);
        }
        $request->session()->put('admin_seen', now()->getTimestamp());

        return $next($request);
    }

    /** Changes whenever the admin's password or authenticator is reset. */
    public static function credentialKey(\App\Models\Admin $admin): string
    {
        return hash_hmac('sha256', $admin->getKey().'|'.$admin->password.'|'.$admin->totp_secret, (string) config('app.key'));
    }
}
