<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\Booking;
use App\Models\Business;
use App\Models\Payment;
use App\Models\Review;
use App\Models\ReviewReport;
use App\Models\Subscription;
use App\Models\User;
use App\Support\Baku;
use Illuminate\View\View;

/** What needs someone today, and how the marketplace is doing. */
class DashboardController extends Controller
{
    public function index(): View
    {
        $today = Baku::today();
        $now = now();
        $visits = fn () => Booking::query()->where('kind', Booking::VISIT);

        $pending = Business::query()->where('status', Business::PENDING)->with(['owner', 'subscription'])
            ->withCount(['services', 'masters', 'photos'])->orderBy('created_at')->limit(8)->get();
        $reported = Review::query()->whereIn('id', ReviewReport::query()->whereNull('resolved_at')->select('review_id'))
            ->withCount(['reports as open_reports' => fn ($q) => $q->whereNull('resolved_at')])
            ->with('business:id,name')->orderByDesc('open_reports')->limit(5)->get();
        $endingTrials = Subscription::query()->where('status', Subscription::TRIALING)
            ->whereBetween('trial_ends_at', [$now, $now->copy()->addDays(3)])->with('business:id,name,status')->orderBy('trial_ends_at')->limit(8)->get();
        $inGrace = Subscription::query()->where('status', Subscription::PAST_DUE)->with('business:id,name,status')->orderBy('updated_at')->limit(8)->get();

        $subs = Subscription::query()->selectRaw('status, count(*) as n')->groupBy('status')->pluck('n', 'status');
        $monthStart = Baku::now()->startOfMonth()->utc();

        return view('admin.dashboard', [
            'stats' => [
                'pending' => Business::query()->where('status', Business::PENDING)->count(),
                'listed' => Business::query()->listable()->count(),
                'suspended' => Business::query()->where('status', Business::SUSPENDED)->count(),
                'reports' => ReviewReport::query()->whereNull('resolved_at')->distinct('review_id')->count('review_id'),
                'customers' => User::query()->where('role', 'customer')->count(),
                'customersNew' => User::query()->where('role', 'customer')->where('created_at', '>=', $now->copy()->subDays(7))->count(),
                'bookingsToday' => $visits()->where('status', '!=', Booking::CANCELLED)
                    ->whereBetween('start_at', [$today->utc(), $today->addDay()->utc()])->count(),
                'bookingsWeek' => $visits()->where('created_at', '>=', $now->copy()->subDays(7))->count(),
                'cancelledWeek' => $visits()->where('status', Booking::CANCELLED)->where('cancelled_at', '>=', $now->copy()->subDays(7))->count(),
                'trialing' => (int) ($subs[Subscription::TRIALING] ?? 0),
                'active' => (int) ($subs[Subscription::ACTIVE] ?? 0),
                'pastDue' => (int) ($subs[Subscription::PAST_DUE] ?? 0),
                'expired' => (int) ($subs[Subscription::EXPIRED] ?? 0),
                'revenueMonth' => (int) Payment::query()->where('status', Payment::PAID)->where('paid_at', '>=', $monthStart)->sum('amount'),
                'reviewsWeek' => Review::query()->where('created_at', '>=', $now->copy()->subDays(7))->count(),
            ],
            'pending' => $pending,
            'reported' => $reported,
            'endingTrials' => $endingTrials,
            'inGrace' => $inGrace,
            'activity' => AdminAction::query()->with('admin:id,name')->latest('created_at')->limit(8)->get(),
        ]);
    }
}
