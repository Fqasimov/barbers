<?php

use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['name' => 'Usta API', 'docs' => 'docs/api.md']));

// The payment provider redirects the browser here; we hand over to the app.
Route::get('billing/return', [PaymentController::class, 'return'])->name('billing.return');

// FakeGateway's hosted page (local/testing only; 404 with a real driver).
Route::get('billing/fake/{payment}', [PaymentController::class, 'fakeCheckout'])
    ->middleware('signed')->name('billing.fake');

require __DIR__.'/admin.php';
