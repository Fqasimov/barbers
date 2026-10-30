<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\Booking;
use App\Models\Business;
use App\Models\Payment;
use App\Models\Review;
use App\Models\Subscription;
use App\Support\AdminView;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
