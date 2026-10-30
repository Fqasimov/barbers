<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\Review;
use App\Services\ReviewModeration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/** Reported reviews first. Store rules expect reports to be handled within 24 hours. */
class ReviewController extends Controller
{
    public function index(Request $request): View
    {
        $tab = in_array($request->query('tab'), ['reported', 'hidden', 'all'], true) ? $request->query('tab') : 'reported';
        $q = trim((string) $request->query('q', ''));

        $reviews = Review::query()
            ->when($tab === 'reported', fn ($r) => $r->whereHas('reports', fn ($x) => $x->whereNull('resolved_at')))
            ->when($tab === 'hidden', fn ($r) => $r->whereNotNull('hidden_at'))
            ->when($q !== '', fn ($r) => $r->where(fn ($w) => $w->where('text', 'like', "%{$q}%")->orWhere('author', 'like', "%{$q}%")
                ->orWhereHas('business', fn ($b) => $b->where('name', 'like', "%{$q}%"))))
            ->with(['business:id,name', 'reports' => fn ($x) => $x->whereNull('resolved_at')->latest()])
            ->withCount(['reports as open_reports' => fn ($x) => $x->whereNull('resolved_at')])
            ->when($tab === 'reported', fn ($r) => $r->orderByDesc('open_reports'))
            ->latest()
            ->paginate(25)->withQueryString();

        return view('admin.reviews.index', [
            'reviews' => $reviews, 'tab' => $tab, 'q' => $q,
            'reportedCount' => Review::query()->whereHas('reports', fn ($x) => $x->whereNull('resolved_at'))->count(),
        ]);
    }

    public function hide(Request $request, string $id, ReviewModeration $moderation): RedirectResponse
    {
        return $this->act($request, $id, 'hide', fn (Review $r) => $moderation->hide($r), 'Hidden. The salon\'s rating is updated.');
    }

    public function restore(Request $request, string $id, ReviewModeration $moderation): RedirectResponse
    {
        return $this->act($request, $id, 'restore', fn (Review $r) => $moderation->restore($r), 'Visible again.');
    }

    public function dismiss(Request $request, string $id, ReviewModeration $moderation): RedirectResponse
    {
        return $this->act($request, $id, 'dismiss', fn (Review $r) => $moderation->dismiss($r), 'Reports dismissed; the review stays.');
    }

    private function act(Request $request, string $id, string $verb, callable $fn, string $done): RedirectResponse
    {
        $review = Review::query()->with('business:id,name')->findOrFail($id);
        $fn($review);
        $what = "{$review->rating}★ by {$review->author} on ".($review->business?->name ?? $review->business_id);
        AdminAction::record($request, "review.{$verb}", $review, ucfirst($verb === 'dismiss' ? 'dismissed reports on' : ($verb === 'hide' ? 'hid' : 'restored'))." {$what}");

        return back()->with('status', $done);
    }
}
