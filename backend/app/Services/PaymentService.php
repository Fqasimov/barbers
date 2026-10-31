<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Booking;
use App\Models\Business;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use App\Payments\CallbackResult;
use App\Payments\PaymentGateway;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Three things are paid for: the plan (subscription), a booking deposit at a
 * Pro salon, and the WhatsApp message pack. One gateway, one callback.
 */
class PaymentService
{
    public const SUBSCRIPTION = 'subscription';

    public const DEPOSIT = 'deposit';

    public const WHATSAPP = 'whatsapp';

    public function __construct(private PaymentGateway $gateway, private Notifier $notifier) {}

    /**
     * What a plan costs this account: Pro includes three locations (the main
     * salon and two branches); each further one adds a monthly fee.
     *
     * @return array{amount:int, locations:int, extra:int}
     */
    public function price(Business $account, string $plan, string $period = 'month'): array
    {
        $amount = (int) config("usta.plans.{$plan}.{$period}");
        $locations = 1;
        $extra = 0;
        if ($plan === 'pro') {
            $locations = 1 + $account->branches()->count();
            $extra = max(0, $locations - (int) config('usta.branches.included'));
            $amount += $extra * (int) config('usta.branches.extra_month') * ($period === 'year' ? 10 : 1);
        }

        return ['amount' => $amount, 'locations' => $locations, 'extra' => $extra];
    }

    /** @return array{checkout_url:string, payment_id:string, amount:int} */
    public function checkout(Business $account, string $plan, string $period = 'month'): array
    {
        $price = $this->price($account, $plan, $period);

        return $this->open($account, [
            'kind' => self::SUBSCRIPTION,
            'plan' => $plan,
            'billing_period' => $period,
            'locations' => $price['locations'],
            'amount' => $price['amount'],
        ], $plan);
    }

    /** The client pays the deposit of a pending_payment booking. */
    public function depositCheckout(Booking $booking, User $user): array
    {
        return $this->open($booking->business, [
            'kind' => self::DEPOSIT,
            'plan' => 'deposit',
            'booking_id' => $booking->id,
            'user_id' => $user->id,
            'amount' => (int) $booking->deposit,
        ], 'deposit');
    }

    /** 300 WhatsApp messages for 30 days (Start and Pro). */
    public function whatsappCheckout(Business $account): array
    {
        return $this->open($account, [
            'kind' => self::WHATSAPP,
            'plan' => 'whatsapp',
            'amount' => (int) config('usta.whatsapp.price'),
        ], 'whatsapp');
    }

    private function open(Business $business, array $attrs, string $label): array
    {
        $payment = new Payment;
        $payment->forceFill($attrs + [
            'business_id' => $business->id,
            'currency' => config('usta.currency'),
            'status' => Payment::PENDING,
            'provider' => $this->gateway->name(),
        ])->save();

        $result = $this->gateway->createCheckout($business, $label, $payment);
        $payment->forceFill(['provider_ref' => $result->providerRef])->save();

        return ['checkout_url' => $result->url, 'payment_id' => $payment->id, 'amount' => (int) $payment->amount];
    }

    /**
     * Applies a verified callback. Idempotent: a payment that is already paid
     * is left alone. Amount and currency must match what we asked for.
     */
    public function apply(CallbackResult $result, array $raw = []): Payment
    {
        $mismatch = false;
        $confirmed = null;
        $payment = DB::transaction(function () use ($result, $raw, &$mismatch, &$confirmed) {
            $payment = Payment::query()->whereKey($result->paymentId)->lockForUpdate()->first();
            if (! $payment) {
                throw ApiException::notFound('Unknown payment.');
            }
            if ($payment->status === Payment::PAID) {
                return $payment;
            }

            $payment->raw_callback = $raw ?: null;
            if ($result->providerRef && ! $payment->provider_ref) {
                $payment->provider_ref = $result->providerRef;
            }

            if ($result->status === Payment::PAID) {
                if ($result->amount !== (int) $payment->amount || strtoupper($result->currency) !== $payment->currency) {
                    // Kept pending with the raw callback stored for investigation.
                    $payment->save();
                    $mismatch = true;

                    return $payment;
                }
                $payment->forceFill(['status' => Payment::PAID, 'paid_at' => now()])->save();
                match ($payment->kind ?? self::SUBSCRIPTION) {
                    self::DEPOSIT => $confirmed = $this->depositPaid($payment),
                    self::WHATSAPP => $this->addWhatsAppPack($payment),
                    default => $this->activate($payment),
                };
            } elseif ($result->status === Payment::FAILED) {
                $payment->status = Payment::FAILED;
                $payment->save();
            } else {
                $payment->save();
            }

            return $payment;
        });

        if ($mismatch) {
            Log::warning('Payment callback amount/currency mismatch', ['payment' => $payment->id]);
            throw new ApiException(422, 'amount_mismatch', 'The paid amount or currency does not match the order.');
        }
        if ($confirmed instanceof Booking) {
            $this->notifier->bookingCreated($confirmed);
        } elseif ($confirmed === false) {
            $this->refund($payment);
        }

        return $payment;
    }

    /**
     * The deposit came in: the booking is confirmed if it still holds the
     * slot, or the slot is still free after a late payment. Otherwise the
     * money goes back (returns false).
     */
    private function depositPaid(Payment $payment): Booking|false
    {
        $booking = Booking::query()->whereKey($payment->booking_id)->lockForUpdate()->first();
        if (! $booking) {
            return false;
        }
        if ($booking->status === Booking::UPCOMING) {
            return $booking;
        }
        if ($booking->status === Booking::PENDING_PAYMENT || ($booking->status === Booking::CANCELLED && $booking->cancelled_by === 'system')) {
            $free = ! Booking::query()->blocking()->whereKeyNot($booking->id)->where('master_id', $booking->master_id)
                ->where('start_at', '<', $booking->end_at)->where('end_at', '>', $booking->start_at)->exists();
            $held = $booking->status === Booking::PENDING_PAYMENT && $booking->hold_until?->isFuture();
            if (($held || $free) && $booking->start_at->isFuture()) {
                $booking->forceFill([
                    'status' => Booking::UPCOMING,
                    'deposit_status' => 'paid',
                    'hold_until' => null,
                    'cancelled_by' => null,
                    'cancelled_at' => null,
                ])->save();

                return $booking;
            }
        }
        $booking->forceFill([
            'status' => Booking::CANCELLED,
            'cancelled_by' => $booking->cancelled_by ?? 'system',
            'cancelled_at' => $booking->cancelled_at ?? now(),
            'deposit_status' => 'refund_due',
            'hold_until' => null,
        ])->save();

        return false;
    }

    /** Gives a deposit back. Marks the booking refunded, or refund_due for staff when the provider refuses. */
    public function refund(Payment $payment): bool
    {
        if ($payment->status !== Payment::PAID || $payment->refunded_at) {
            return (bool) $payment->refunded_at;
        }
        try {
            $ok = $this->gateway->refund($payment);
        } catch (Throwable $e) {
            Log::error('Deposit refund failed', ['payment' => $payment->id, 'error' => $e->getMessage()]);
            $ok = false;
        }
        if ($ok) {
            $payment->forceFill(['refunded_at' => now()])->save();
        }
        if ($payment->booking_id) {
            Booking::query()->whereKey($payment->booking_id)->update(['deposit_status' => $ok ? 'refunded' : 'refund_due', 'updated_at' => now()]);
        }

        return $ok;
    }

    /** The paid deposit of a booking, if any. */
    public function depositPayment(Booking $booking): ?Payment
    {
        return Payment::query()->where('booking_id', $booking->id)->where('kind', self::DEPOSIT)
            ->where('status', Payment::PAID)->latest('paid_at')->first();
    }

    /** A new pack replaces what is left of the old one and runs 30 days. */
    private function addWhatsAppPack(Payment $payment): void
    {
        $business = Business::query()->whereKey($payment->business_id)->lockForUpdate()->first();
        if (! $business) {
            return;
        }
        $live = $business->whatsapp_until && $business->whatsapp_until->isFuture();
        $left = $live ? max(0, $business->whatsapp_quota - $business->whatsapp_used) : 0;
        $business->forceFill([
            'whatsapp_quota' => $left + (int) config('usta.whatsapp.messages'),
            'whatsapp_used' => 0,
            'whatsapp_until' => now()->addDays((int) config('usta.whatsapp.days')),
        ])->save();
    }

    /**
     * A month or a year on top of what the salon already has: the rest of
     * the free trial or of the paid period is never lost by paying early.
     */
    private function activate(Payment $payment): void
    {
        $now = now();
        $sub = Subscription::query()->where('business_id', $payment->business_id)->lockForUpdate()->first();
        if (! $sub) {
            $sub = new Subscription;
            // Paying first uses up the free trial.
            $sub->forceFill(['business_id' => $payment->business_id, 'started_at' => $now, 'trial_ends_at' => $now]);
        }
        $covered = $sub->status === Subscription::EXPIRED ? null : $sub->coveredUntil();
        $from = $covered && $covered->gt($now) ? $covered : $now;
        $sub->forceFill([
            'plan' => $payment->plan,
            'billing_period' => $payment->billing_period,
            'status' => Subscription::ACTIVE,
            'current_period_end' => $from->copy()->addMonthsNoOverflow($payment->billing_period === 'year' ? 12 : 1),
        ])->save();
    }
}
