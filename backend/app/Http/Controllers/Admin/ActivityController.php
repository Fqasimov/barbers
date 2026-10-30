<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use Illuminate\Http\Request;
use Illuminate\View\View;

/** The audit log. Entries are never edited or deleted from the panel. */
class ActivityController extends Controller
{
    public function index(Request $request): View
    {
        $q = trim((string) $request->query('q', ''));

        return view('admin.activity.index', [
            'actions' => AdminAction::query()->with('admin:id,name')
                ->when($q !== '', fn ($a) => $a->where(fn ($w) => $w->where('summary', 'like', "%{$q}%")->orWhere('subject_id', $q)->orWhere('action', $q)))
                ->latest('created_at')->latest('id')->paginate(50)->withQueryString(),
            'q' => $q,
        ]);
    }
}
