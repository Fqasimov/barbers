<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AdminAction;
use App\Support\Totp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class AuthController extends Controller
{
    private const MAX_ATTEMPTS = 5;

    private const MAX_ACCOUNT_ATTEMPTS = 20;

    public function show(): View|RedirectResponse
    {
        if (Auth::guard('admin')->check()) {
            return redirect()->route('admin.dashboard');
        }

        return view('admin.login');
    }

    /** Email + password + authenticator code; one generic error so nothing leaks which part was wrong. */
    public function login(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:10'],
        ]);
        $email = mb_strtolower(trim($data['email']));
        $key = 'admin-login:'.sha1($email.'|'.$request->ip());
        // Per account too, whatever the IP: 20 wrong tries lock it for 15 minutes.
        $accountKey = 'admin-login-account:'.sha1($email);

        foreach ([[$key, self::MAX_ATTEMPTS], [$accountKey, self::MAX_ACCOUNT_ATTEMPTS]] as [$k, $max]) {
            if (RateLimiter::tooManyAttempts($k, $max)) {
                throw ValidationException::withMessages(['email' => 'Too many attempts. Try again in '.RateLimiter::availableIn($k).' seconds.']);
            }
        }

        $admin = Admin::query()->where('email', $email)->first();
        $code = preg_replace('/\D/', '', $data['code']);
        $passwordOk = Hash::check($data['password'], $admin?->password ?? '$2y$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
        $step = $admin && $passwordOk && ! $admin->disabled_at ? Totp::verify($admin->totp_secret, $code, $admin->totp_last_step, now()->getTimestamp()) : null;

        if ($step === null) {
            RateLimiter::hit($key, 60);
            RateLimiter::hit($accountKey, 900);

            throw ValidationException::withMessages(['email' => 'The email, password or code is wrong.']);
        }

        RateLimiter::clear($key);
        RateLimiter::clear($accountKey);
        $admin->forceFill(['totp_last_step' => $step, 'last_login_at' => now()])->save();
        Auth::guard('admin')->login($admin);
        $request->session()->regenerate();
        $request->session()->put('admin_seen', now()->getTimestamp());
        AdminAction::record($request, 'login', $admin, "{$admin->name} signed in");

        return redirect()->intended(route('admin.dashboard'));
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('admin')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login')->with('status', 'Signed out.');
    }
}
