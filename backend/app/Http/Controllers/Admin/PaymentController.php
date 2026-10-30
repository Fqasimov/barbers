<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Support\Baku;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PaymentController extends Controller
{
    public function index(Request $request): View
    {
        $status = in_array($request->query('status'), [Payment::PENDING, Payment::PAID, Payment::FAILED], true) ? $request->query('status') : null;
        $monthStart = Baku::now()->startOfMonth()->utc();

        return view('admin.payments.index', [
            'payments' => Payment::query()->when($status, fn ($p) => $p->where('status', $status))
                ->with(['business' => fn ($b) => $b->withTrashed()->select('id', 'name')])
                ->latest()->paginate(40)->withQueryString(),
            'status' => $status,
            'totals' => [
                'month' => (int) Payment::query()->where('status', Payment::PAID)->where('paid_at', '>=', $monthStart)->sum('amount'),
                'all' => (int) Payment::query()->where('status', Payment::PAID)->sum('amount'),
                'pending' => Payment::query()->where('status', Payment::PENDING)->count(),
            ],
        ]);
    }
}
