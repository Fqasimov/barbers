<?php

namespace Tests\Feature;

use App\Jobs\SendPush;
use App\Jobs\SendWhatsApp;
use App\Mail\BookingMail;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** Clients booking in a browser have no push: confirmation and reminders go by email. */
class ClientEmailsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Bus::fake([SendPush::class, SendWhatsApp::class]);
    }

    public function json($method, $uri, array $data = [], array $headers = [], $options = 0)
    {
        $this->app['auth']->forgetGuards();

        return parent::json($method, $uri, $data, $headers, $options);
    }

    private function auth(User $u): array
    {
        return ['Authorization' => 'Bearer '.$this->tokenFor($u)];
    }

    private function mailsTo(string $email, string $kind)
    {
        return Mail::queued(BookingMail::class, fn (BookingMail $m) => $m->hasTo($email) && $m->kind === $kind);
    }

    public function test_a_booking_emails_the_client_a_confirmation_and_the_salon_a_notice(): void
    {
        $salon = $this->makeSalon(['address' => 'Nizami 10', 'district' => 'Səbail']);
        $client = User::factory()->create(['email' => 'client@example.com']);
        $this->postJson('/api/bookings', [
            'salon_id' => $salon->id,
            'master_id' => $salon->masters()->first()->id,
            'service_ids' => [$salon->services()->first()->id],
            'start' => '2026-10-13T08:00:00.000Z',
        ], $this->auth($client))->assertCreated();

        $mails = $this->mailsTo('client@example.com', 'confirmed');
        $this->assertCount(1, $mails);
        $text = implode("\n", $mails->first()->lines);
        $this->assertStringContainsString('13.10.2026 12:00', $text); // Baku time
        $this->assertStringContainsString('Nizami 10, Səbail', $text);
        $this->assertStringContainsString($salon->masters()->first()->name, $text);
        $this->assertStringContainsString('https://yazilnow.az/app/bookings', $text);
        $this->assertStringContainsString('booking confirmed', $mails->first()->envelope()->subject);
        $this->assertCount(1, $this->mailsTo($salon->owner->email, 'created'));
    }

    public function test_reminders_24h_and_2h_go_by_email_once_each(): void
    {
        $salon = $this->makeSalon();
        $client = User::factory()->create(['email' => 'client@example.com']);
        $this->makeBooking($salon, $salon->masters()->first(), $client, '2026-10-13 08:00:00');

        $this->travelTo(CarbonImmutable::parse('2026-10-12 09:00:00', 'UTC')); // 23 h before
        $this->artisan('usta:send-reminders');
        $this->artisan('usta:send-reminders');
        $this->assertCount(1, $this->mailsTo('client@example.com', 'reminder_24h'));

        $this->travelTo(CarbonImmutable::parse('2026-10-13 06:30:00', 'UTC')); // 1.5 h before
        $this->artisan('usta:send-reminders');
        $this->artisan('usta:send-reminders');
        $this->assertCount(1, $this->mailsTo('client@example.com', 'reminder_2h'));
    }

    public function test_the_salon_is_emailed_when_a_client_cancels(): void
    {
        $salon = $this->makeSalon();
        $client = User::factory()->create();
        $booking = $this->makeBooking($salon, $salon->masters()->first(), $client, '2026-10-14 08:00:00');
        $this->postJson("/api/bookings/{$booking->id}/cancel", [], $this->auth($client))->assertOk();
        $this->assertCount(1, $this->mailsTo($salon->owner->email, 'cancelled_by_customer'));
    }

    public function test_walk_ins_without_an_account_get_no_email(): void
    {
        $salon = $this->makeSalon();
        $this->postJson('/api/business/bookings', [
            'master_id' => $salon->masters()->first()->id,
            'service_ids' => [$salon->services()->first()->id],
            'start' => '2026-10-13T08:00:00.000Z',
            'client_name' => 'Walk-in',
        ], $this->auth($salon->owner))->assertCreated();
        Mail::assertNotQueued(BookingMail::class, fn (BookingMail $m) => $m->kind === 'confirmed');
    }
}
