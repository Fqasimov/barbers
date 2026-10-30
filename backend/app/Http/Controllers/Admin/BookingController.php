<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Support\Baku;
use Illuminate\Http\Request;
use Illuminate\View\View;

/** Every appointment, read-only: salons and customers change their own bookings. */
class BookingController extends Controller
{
    public const STATUSES = [Booking::UPCOMING, Booking::COMPLETED, Booking::CANCELLED, Booking::NO_SHOW];

    public function index(Request $request): View
    {
        $data = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
            'status' => ['nullable', 'string'],
            'source' => ['nullable', 'in:customer,salon'],
            'q' => ['nullable', 'string', 'max:120'],
        ]);
        $from = $data['from'] ?? Baku::today()->subDays(7)->format('Y-m-d');
        $to = $data['to'] ?? Baku::today()->addDays(14)->format('Y-m-d');
        $status = in_array($data['status'] ?? null, self::STATUSES, true) ? $data['status'] : null;
        $q = trim($data['q'] ?? '');

        $bookings = Booking::query()->where('kind', Booking::VISIT)
            ->whereBetween('start_at', [Baku::date($from)->utc(), Baku::date($to)->addDay()->utc()])
            ->when($status, fn ($b) => $b->where('status', $status))
            ->when($data['source'] ?? null, fn ($b, $s) => $b->where('source', $s))
            ->when($q !== '', fn ($b) => $b->where(fn ($w) => $w->where('id', $q)->orWhere('client_name', 'like', "%{$q}%")
                ->orWhereHas('business', fn ($s) => $s->withTrashed()->where('name', 'like', "%{$q}%"))
                ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$q}%"))))
            ->with(['business' => fn ($s) => $s->withTrashed()->select('id', 'name'), 'user:id,first_name,last_name,email'])
            ->orderBy('start_at')
            ->paginate(50)->withQueryString();

        return view('admin.bookings.index', compact('bookings', 'from', 'to', 'status', 'q') + ['source' => $data['source'] ?? null]);
    }
}
