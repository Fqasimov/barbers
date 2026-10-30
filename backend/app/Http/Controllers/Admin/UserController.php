<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\Booking;
use App\Models\Review;
use App\Models\User;
use App\Services\AccountDeletion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class UserController extends Controller
{
    public function index(Request $request): View
    {
        $q = trim((string) $request->query('q', ''));
        $role = $request->query('role');

        $users = User::query()
            ->when(in_array($role, ['customer', 'business'], true), fn ($u) => $u->where('role', $role))
            ->when($q !== '', fn ($u) => $u->where(fn ($w) => $w->where('email', 'like', "%{$q}%")->orWhere('phone', 'like', "%{$q}%")
                ->orWhere('id', $q)
                // "Nərmin Əliyeva": every word in the first or the last name (portable across databases).
                ->orWhere(function ($n) use ($q) {
                    foreach (preg_split('/\s+/u', $q) as $word) {
                        $n->where(fn ($x) => $x->where('first_name', 'like', "%{$word}%")->orWhere('last_name', 'like', "%{$word}%"));
                    }
                })))
            ->withCount(['bookings', 'tokens'])
            ->with('business:id,owner_id,name,status')
            ->latest()->paginate(30)->withQueryString();

        return view('admin.users.index', compact('users', 'q', 'role'));
    }

    public function show(string $id): View
    {
        $user = User::query()->with('business')->withCount(['tokens', 'pushTokens'])->findOrFail($id);

        return view('admin.users.show', [
            'user' => $user,
            'bookings' => Booking::query()->where('user_id', $id)->with('business:id,name')->latest('start_at')->limit(20)->get(),
            'reviews' => Review::query()->where('user_id', $id)->with('business:id,name')->latest()->limit(10)->get(),
            'activity' => AdminAction::query()->where('subject_type', 'user')->where('subject_id', $id)->with('admin:id,name')->latest('created_at')->limit(10)->get(),
        ]);
    }

    /** Ends every app session: a lost phone, a shared account. */
    public function signOut(Request $request, string $id): RedirectResponse
    {
        $user = User::query()->findOrFail($id);
        $n = $user->tokens()->delete();
        $user->pushTokens()->delete();
        AdminAction::record($request, 'user.sign_out', $user, "Signed {$user->email} out of {$n} session(s)");

        return back()->with('status', "Signed out of {$n} session(s). They sign in again with their password or a code.");
    }

    /** The same deletion as "Delete account" in the app. The email must be typed to confirm. */
    public function destroy(Request $request, string $id, AccountDeletion $deletion): RedirectResponse
    {
        $user = User::query()->findOrFail($id);
        $data = $request->validate(['confirm' => ['required', 'string'], 'reason' => ['required', 'string', 'max:255']]);
        if (mb_strtolower(trim($data['confirm'])) !== mb_strtolower($user->email)) {
            throw ValidationException::withMessages(['confirm' => 'Type the account\'s email exactly to confirm.']);
        }
        $email = $user->email;
        AdminAction::record($request, 'user.delete', $user, "Deleted {$email}: {$data['reason']}", ['role' => $user->role]);
        $deletion->delete($user);

        return redirect()->route('admin.users')->with('status', "{$email} is deleted. Past bookings and reviews stay, anonymised.");
    }
}
