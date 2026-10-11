<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Payments\FakeGateway;
use App\Payments\PaymentGateway;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    private function setUpSalon(): array
    {
        $salon = $this->makeSalon();
        $h = ['Authorization' => 'Bearer '.$this->tokenFor($salon->owner)];

        return [$salon, $h];
    }

    private function sendCallback(string $id, string $status = 'paid', int $amount = 59, string $currency = 'AZN', ?string $sig = null)
    {
        return $this->postJson('/api/payments/fake/callback', [
            'payment_id' => $id, 'status' => $status, 'amount' => $amount, 'currency' => $currency,
            'signature' => $sig ?? FakeGateway::sign($id, $status, $amount, $currency),
        ]);
    }

    public function test_fake_checkout_page_pays_and_redirects_to_the_app(): void
    {
        [$salon, $h] = $this->setUpSalon();
        $res = $this->postJson('/api/business/subscription/checkout', ['plan' => 'pro'], $h)->assertOk()
            ->assertJsonStructure(['checkout_url', 'payment_id']);
        $id = $res->json('payment_id');
        $this->assertDatabaseHas('payments', ['id' => $id, 'status' => 'pending', 'amount' => 59, 'currency' => 'AZN', 'provider' => 'fake']);

        $this->get($res->json('checkout_url'))->assertRedirect("/billing/return?payment_id={$id}");
        $this->get("/billing/return?payment_id={$id}")->assertRedirect("usta://billing/return?payment_id={$id}");

        $this->getJson('/api/business/subscription', $h)->assertOk()
            ->assertJsonPath('status', 'active')->assertJsonPath('plan', 'pro')
            ->assertJsonPath('current_period_end', '2026-11-12T06:00:00.000Z');

        // Unsigned / tampered checkout URLs are refused.
        $this->get("/billing/fake/{$id}")->assertStatus(403);
    }

    public function test_callback_activates_and_is_idempotent(): void
    {
        [$salon, $h] = $this->setUpSalon();
        $id = $this->postJson('/api/business/subscription/checkout', ['plan' => 'pro'], $h)->json('payment_id');

        $this->sendCallback($id)->assertOk()->assertJsonPath('status', 'paid');
        $this->sendCallback($id)->assertOk()->assertJsonPath('status', 'paid');
        $sub = $salon->subscription()->first();
        $this->assertSame('active', $sub->status);
        $this->assertSame('2026-11-12 06:00:00', $sub->current_period_end->toDateTimeString());
        $this->assertSame('paid', Payment::query()->find($id)->status);
        $this->assertNotNull(Payment::query()->find($id)->raw_callback);

        // A second payment extends from the current end, not from now.
        $id2 = $this->postJson('/api/business/subscription/checkout', ['plan' => 'studio'], $h)->json('payment_id');
        $this->sendCallback($id2, amount: 99)->assertOk();
        $sub->refresh();
        $this->assertSame('2026-12-12 06:00:00', $sub->current_period_end->toDateTimeString());
        $this->assertSame('studio', $sub->plan);
    }

    public function test_wrong_amount_currency_or_signature_is_rejected(): void
    {
        [$salon, $h] = $this->setUpSalon();
        $id = $this->postJson('/api/business/subscription/checkout', ['plan' => 'pro'], $h)->json('payment_id');

        $this->sendCallback($id, amount: 1)->assertStatus(422)->assertJsonPath('error', 'amount_mismatch');
        $this->sendCallback($id, currency: 'USD')->assertStatus(422);
        $this->sendCallback($id, sig: 'forged')->assertStatus(400)->assertJsonPath('error', 'invalid_callback');
        $this->postJson('/api/payments/other/callback', [])->assertStatus(404);
        $this->assertSame('pending', Payment::query()->find($id)->status);
        $this->assertSame('trialing', $salon->subscription()->first()->status);

        $this->sendCallback($id, 'failed')->assertOk()->assertJsonPath('status', 'failed');
    }

    public function test_fake_driver_is_refused_in_production(): void
    {
        $this->app['env'] = 'production';
        $this->app->forgetInstance(PaymentGateway::class);
        $this->expectException(\RuntimeException::class);
        $this->app->make(PaymentGateway::class);
    }
}
