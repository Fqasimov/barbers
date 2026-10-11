<?php

namespace App\Http\Controllers;

use App\Exceptions\ApiException;
use App\Models\Payment;
use App\Payments\CallbackResult;
use App\Payments\FakeGateway;
use App\Payments\PaymentGateway;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private PaymentGateway $gateway, private PaymentService $payments) {}

    /** POST /api/payments/{provider}/callback — server-to-server from the provider. */
    public function callback(Request $request, string $provider): JsonResponse
    {
        if ($provider !== $this->gateway->name()) {
            throw ApiException::notFound();
        }
        $result = $this->gateway->verifyCallback($request);
        $payment = $this->payments->apply($result, $request->all());

        return response()->json(['ok' => true, 'payment_id' => $payment->id, 'status' => $payment->status]);
    }

    /** GET /billing/return — where the provider sends the browser; hands over to the app. */
    public function return(Request $request): RedirectResponse
    {
        $id = (string) $request->query('payment_id', '');
        $query = preg_match('/^[0-9a-f-]{36}$/i', $id) ? '?payment_id='.$id : '';

        return redirect()->away(config('usta.app_scheme').'://billing/return'.$query);
    }

    /** GET /billing/fake/{payment} (signed) — the fake gateway's "hosted page": pays at once. */
    public function fakeCheckout(Request $request, string $payment): RedirectResponse
    {
        if (! $this->gateway instanceof FakeGateway) {
            abort(404);
        }
        $p = Payment::query()->findOrFail($payment);
        $this->payments->apply(new CallbackResult($p->id, Payment::PAID, (int) $p->amount, $p->currency, 'fake_'.$p->id), ['simulated' => true]);

        return redirect('/billing/return?payment_id='.$p->id);
    }
}
