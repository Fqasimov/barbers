<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\Booking;
use App\Models\Business;
use App\Models\Payment;
use App\Models\Review;
use App\Models\Subscription;
use App\Models\User;
use App\Rules\V;
use App\Support\AdminView;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class SalonController extends Controller
{
    public const STATUSES = [Business::PENDING, Business::LIVE, Business::SUSPENDED, 'deleted'];

    public function index(Request $request): View
    {
        $q = trim((string) $request->query('q', ''));
        $status = $request->query('status');
        $plan = $request->query('sub');

        $salons = Business::query()
            ->when($status === 'deleted', fn ($b) => $b->onlyTrashed(), fn ($b) => $b->when(in_array($status, self::STATUSES, true), fn ($b) => $b->where('status', $status)))
            ->when($q !== '', fn ($b) => $b->where(fn ($w) => $w
                ->where('name', 'like', "%{$q}%")->orWhere('id', $q)->orWhere('district', 'like', "%{$q}%")
                ->orWhereHas('owner', fn ($o) => $o->where('email', 'like', "%{$q}%")->orWhere('phone', 'like', "%{$q}%"))))
            ->when($plan === 'none', fn ($b) => $b->doesntHave('subscription'))
            ->when(in_array($plan, [Subscription::TRIALING, Subscription::ACTIVE, Subscription::PAST_DUE, Subscription::EXPIRED], true),
                fn ($b) => $b->whereHas('subscription', fn ($s) => $s->where('status', $plan)))
            ->with(['owner:id,first_name,last_name,email', 'subscription'])
            ->withCount(['services', 'masters', 'photos'])
            ->orderByRaw("case when status = 'pending_review' then 0 else 1 end")
            ->latest()
            ->paginate(25)->withQueryString();

        return view('admin.salons.index', compact('salons', 'q', 'status', 'plan'));
    }

    public function show(string $id): View
    {
        $salon = Business::withTrashed()->with(['owner', 'subscription', 'services', 'masters', 'photos'])->findOrFail($id);
        $upcoming = Booking::query()->where('business_id', $id)->where('kind', Booking::VISIT)->where('status', Booking::UPCOMING)->count();

        return view('admin.salons.show', [
            'salon' => $salon,
            'checks' => [
                'Approved (live)' => $salon->status === Business::LIVE,
                'At least one service' => $salon->services->isNotEmpty(),
                'At least one master' => $salon->masters->isNotEmpty(),
                'Trial or paid plan running' => (bool) $salon->subscription && $salon->subscription->status !== Subscription::EXPIRED
                    && $salon->subscription->graceEndsAt()?->isFuture(),
            ],
            'listed' => ! $salon->trashed() && $salon->isListable(),
            'upcoming' => $upcoming,
            'bookings' => Booking::query()->where('business_id', $id)->with('user:id,first_name,last_name,email')->latest('start_at')->limit(15)->get(),
            'reviews' => Review::query()->where('business_id', $id)->latest()->limit(10)->get(),
            'payments' => Payment::query()->where('business_id', $id)->latest()->limit(10)->get(),
            'activity' => AdminAction::query()->where('subject_type', 'salon')->where('subject_id', $id)->with('admin:id,name')->latest('created_at')->limit(15)->get(),
            'plans' => array_keys(config('usta.plans')),
        ]);
    }

    public function approve(Request $request, string $id): RedirectResponse
    {
        $salon = Business::query()->findOrFail($id);
        $was = $salon->status;
        $salon->approve();
        AdminAction::record($request, $was === Business::SUSPENDED ? 'salon.reinstate' : 'salon.approve', $salon,
            ($was === Business::SUSPENDED ? 'Reinstated ' : 'Approved ').$salon->name, ['from' => $was]);

        $note = $salon->isListable() ? 'It is in search now.' : 'It shows in search once it has a service, a master and a running plan.';

        return back()->with('status', "{$salon->name} is live. {$note}");
    }

    public function suspend(Request $request, string $id): RedirectResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:255']]);
        $salon = Business::query()->findOrFail($id);
        $salon->suspend($data['reason']);
        AdminAction::record($request, 'salon.suspend', $salon, "Suspended {$salon->name}: {$data['reason']}");

        return back()->with('status', "{$salon->name} is suspended: hidden from search, no new bookings. Existing bookings stay.");
    }

    /** Register a salon by hand (a phone call, a visit): owner, salon, plan. */
    public function create(): View
    {
        return view('admin.salons.create', [
            'categories' => config('usta.categories'),
            'markets' => config('usta.markets'),
            'plans' => array_keys(config('usta.plans')),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'email' => mb_strtolower(trim((string) $request->input('email'))),
            'slug' => mb_strtolower(trim((string) $request->input('slug'))),
            'phone' => preg_replace('/[^\d+]/', '', (string) $request->input('phone')),
        ]);
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:60'],
            'last_name' => ['required', 'string', 'max:60'],
            'email' => ['required', ...V::email()],
            'phone' => ['nullable', 'string', 'regex:'.V::AZ_PHONE],
            'salon_name' => ['required', 'string', 'min:2', 'max:120'],
            'categories' => ['required', 'array', 'min:1'],
            'categories.*' => ['string', 'distinct', Rule::in(config('usta.categories'))],
            'district' => ['required', 'string', 'max:120'],
            'address' => ['required', 'string', 'max:255'],
            'audience' => ['required', Rule::in(['all', 'women', 'men'])],
            'slug' => ['nullable', 'string', 'max:40'],
            'plan' => ['required', Rule::in(array_keys(config('usta.plans')))],
            'billing' => ['required', Rule::in(['trial', 'paid'])],
            'trial_days' => ['required_if:billing,trial', 'nullable', 'integer', 'min:1', 'max:365'],
            'paid_until' => ['required_if:billing,paid', 'nullable', 'date', 'after:today'],
            'approve' => ['sometimes', 'boolean'],
        ]);
        $market = Business::marketOf(array_values($data['categories']));
        if ($market === null) {
            throw ValidationException::withMessages(['categories' => 'A couture showroom and beauty services are separate kinds of business.']);
        }
        if (! in_array($data['plan'], config("usta.markets.{$market}.plans"), true)) {
            throw ValidationException::withMessages(['plan' => 'That plan is for the other kind of business.']);
        }
        if ($data['slug'] !== '' && ($problem = Business::slugProblem($data['slug']))) {
            throw ValidationException::withMessages(['slug' => ['invalid' => 'Latin letters, numbers and hyphens, 3–30 characters.', 'reserved' => 'That address is reserved.', 'taken' => 'That address is taken.'][$problem]]);
        }
        $existing = User::query()->where('email', $data['email'])->first();
        if ($existing && Business::withTrashed()->where('owner_id', $existing->id)->exists()) {
            throw ValidationException::withMessages(['email' => 'This person already has a salon. Open it from Users.']);
        }

        $salon = DB::transaction(function () use ($data, $existing) {
            $user = $existing ?? new User;
            $user->forceFill([
                'email' => $data['email'],
                'first_name' => $existing?->first_name ?: trim($data['first_name']),
                'last_name' => $existing?->last_name ?: trim($data['last_name']),
                'phone' => $existing?->phone ?: ($data['phone'] ?: null),
                'role' => 'business',
                'provider' => $existing?->provider ?? 'password',
                'email_verified_at' => $existing?->email_verified_at ?? now(),
                // Nobody knows it: the owner sets their own with "Forgot password".
                'password' => $existing?->password ?? Str::random(48),
            ])->save();

            $salon = new Business;
            $salon->forceFill([
                'owner_id' => $user->id,
                'name' => trim($data['salon_name']),
                'categories' => array_values($data['categories']),
                'district' => trim($data['district']),
                'address' => trim($data['address']),
                'audience' => $data['audience'],
                'closed_days' => [],
                'phone' => $data['phone'] ?? '',
                'whatsapp' => ltrim((string) ($data['phone'] ?? ''), '+'),
                'status' => Business::PENDING,
                'slug' => $data['slug'] !== '' ? $data['slug'] : null,
            ])->save();
            if (! $salon->slug) {
                $salon->assignSlugFromName();
            }

            $now = now();
            (new Subscription)->forceFill([
                'business_id' => $salon->id,
                'plan' => $data['plan'],
                'billing_period' => 'month',
                'started_at' => $now,
            ] + ($data['billing'] === 'trial'
                ? ['status' => Subscription::TRIALING, 'trial_ends_at' => $now->copy()->addDays((int) $data['trial_days'])]
                : ['status' => Subscription::ACTIVE, 'current_period_end' => \Illuminate\Support\Carbon::parse($data['paid_until'])->endOfDay()]))->save();

            if (! empty($data['approve'])) {
                $salon->approve();
            }
            $salon->fresh()->ensureSoloMaster();

            return $salon;
        });

        AdminAction::record($request, 'salon.create', $salon, "Registered {$salon->name} ({$data['plan']}, ".($data['billing'] === 'trial' ? "{$data['trial_days']}-day trial" : "paid until {$data['paid_until']}").") for {$data['email']}");

        return redirect()->route('admin.salons.show', $salon->id)->with('status',
            "{$salon->name} is registered. The owner signs in with {$data['email']}: on first sign-in they tap \"Şifrəni unutdum\" to set a password.");
    }

    /** A sign-up that won't be approved: kept out of search for good (Reinstate undoes it). */
    public function reject(Request $request, string $id): RedirectResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:255']]);
        $salon = Business::query()->findOrFail($id);
        if ($salon->status !== Business::PENDING) {
            return back()->with('status', "{$salon->name} isn't waiting for review.");
        }
        $reason = trim((string) ($data['reason'] ?? '')) ?: 'Rejected at review';
        $salon->suspend($reason);
        AdminAction::record($request, 'salon.reject', $salon, "Rejected {$salon->name}: {$reason}");

        return back()->with('status', "{$salon->name} is rejected: not in search and takes no bookings. Reinstate undoes it.");
    }

    public function extend(Request $request, string $id): RedirectResponse
    {
        $data = $request->validate([
            'days' => ['required', 'integer', 'min:1', 'max:365'],
            'reason' => ['required', 'string', 'max:255'],
        ]);
        $salon = Business::query()->with('subscription')->findOrFail($id);
        $sub = $salon->subscription ?? throw ValidationException::withMessages(['days' => 'This salon has no plan yet.']);
        $before = $sub->coveredUntil();
        $sub->grantDays((int) $data['days']);
        $sub->refresh();
        AdminAction::record($request, 'salon.extend', $salon, "Gave {$salon->name} {$data['days']} days: {$data['reason']}", [
            'days' => (int) $data['days'], 'from' => $before?->toIso8601String(), 'to' => $sub->coveredUntil()?->toIso8601String(),
        ]);

        return back()->with('status', "Added {$data['days']} days. Now runs until ".AdminView::date($sub->coveredUntil()).'.');
    }

    public function plan(Request $request, string $id): RedirectResponse
    {
        $data = $request->validate(['plan' => ['required', Rule::in(array_keys(config('usta.plans')))]]);
        $salon = Business::query()->with('subscription')->findOrFail($id);
        $sub = $salon->subscription ?? throw ValidationException::withMessages(['plan' => 'This salon has no plan yet.']);
        $from = $sub->plan;
        $sub->forceFill(['plan' => $data['plan']])->save();
        AdminAction::record($request, 'salon.plan', $salon, "Changed {$salon->name} from {$from} to {$data['plan']}", ['from' => $from, 'to' => $data['plan']]);

        return back()->with('status', 'Plan changed to '.ucfirst($data['plan']).'. The price changes from the next payment.');
    }
}
