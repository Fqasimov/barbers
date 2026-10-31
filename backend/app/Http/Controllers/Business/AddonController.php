<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** The WhatsApp pack and how to reach support (Pro gets the phone line). */
class AddonController extends Controller
{
    public function whatsapp(Request $request, PaymentService $payments): JsonResponse
    {
        $this->ownerOnly($request);
        $account = $this->account($request);
        $account->requireFeature('whatsapp_addon');

        return response()->json($payments->whatsappCheckout($account));
    }

    public function support(Request $request): JsonResponse
    {
        $priority = $this->business($request)->hasFeature('priority_support');

        return response()->json([
            'email' => config('usta.support.email'),
            'hours' => config('usta.support.hours'),
            'priority' => $priority,
            'phone' => $priority ? config('usta.support.phone') : null,
            'whatsapp_pack' => ['price' => (int) config('usta.whatsapp.price'), 'messages' => (int) config('usta.whatsapp.messages'), 'days' => (int) config('usta.whatsapp.days')],
        ]);
    }
}
