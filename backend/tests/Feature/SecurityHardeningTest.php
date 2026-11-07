<?php

namespace Tests\Feature;

use App\Jobs\SendPush;
use App\Jobs\SendWhatsApp;
use App\Mail\OtpCodeMail;
use App\Models\Booking;
use App\Models\Business;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use App\Payments\FakeGateway;
use App\Support\Baku;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** The fixes from the security audit (docs/security-audit.md). */
class SecurityHardeningTest extends TestCase
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

    /** @return list<string> every code mailed to the address, oldest first */
    private function codes(string $email): array
    {
        return Mail::queued(OtpCodeMail::class, fn (OtpCodeMail $m) => $m->hasTo($email))
            ->map(fn (OtpCodeMail $m) => $m->code)->values()->all();
    }

    private function wrong(string $code): string
    {
        return str_pad((string) (((int) $code + 1) % 1_000_000), 6, '0', STR_PAD_LEFT);
    }

    public function test_asking_for_new_reset_codes_never_buys_more_guesses(): void
    {
        $user = User::factory()->create(['email' => 'aysel@example.com']);
        for ($round = 0; $round < 3; $round++) {
            $this->postJson('/api/auth/password/forgot', ['email' => $user->email])->assertStatus(202);
            $code = last($this->codes($user->email));
            for ($i = 0; $i < 5; $i++) {
                $this->postJson('/api/auth/password/verify', ['email' => $user->email, 'code' => $this->wrong($code)])->assertStatus(422);
            }
            $this->travel(61)->seconds();
        }
        $this->postJson('/api/auth/password/forgot', ['email' => $user->email])->assertStatus(202);
        $code = last($this->codes($user->email));
        // Fifteen wrong guesses today: even the right code is refused until tomorrow.
        $this->postJson('/api/auth/password/verify', ['email' => $user->email, 'code' => $code])
            ->assertStatus(422)->assertJsonPath('error', 'too_many_attempts');

        $this->travel(1)->days();
        $this->postJson('/api/auth/password/forgot', ['email' => $user->email])->assertStatus(202);
        $this->postJson('/api/auth/password/verify', ['email' => $user->email, 'code' => last($this->codes($user->email))])->assertOk();
    }

    public function test_repeated_forgot_requests_reuse_the_code_and_cap_the_emails(): void
    {
        $user = User::factory()->create(['email' => 'aysel@example.com']);
        $this->postJson('/api/auth/password/forgot', ['email' => $user->email])->assertStatus(202);
        $this->postJson('/api/auth/password/forgot', ['email' => $user->email])->assertStatus(202);
        $this->assertCount(1, $this->codes($user->email));

        for ($i = 0; $i < 12; $i++) {
            $this->travel(61)->seconds();
            $this->postJson('/api/auth/password/forgot', ['email' => $user->email])->assertStatus(202);
        }
        $this->assertCount(6, $this->codes($user->email));
    }

    public function test_a_second_paid_deposit_is_refunded_and_the_booking_stays_paid(): void
    {
        $salon = $this->makeSalon();
        Subscription::query()->where('business_id', $salon->id)->update(['plan' => 'pro']);
        $salon = $salon->fresh();
        $salon->services()->first()->forceFill(['deposit_type' => 'fixed', 'deposit_value' => 5])->save();
        $client = User::factory()->create();
        $h = $this->auth($client);
        $id = $this->postJson('/api/bookings', [
            'salon_id' => $salon->id,
            'master_id' => $salon->masters()->first()->id,
            'service_ids' => [$salon->services()->first()->id],
            'start' => '2026-10-13T08:00:00.000Z',
        ], $h)->assertCreated()->assertJsonPath('status', 'pending_payment')->json('id');
        $this->postJson("/api/bookings/{$id}/pay", [], $h)->assertOk();

        $payments = Payment::query()->where('booking_id', $id)->orderBy('created_at')->get();
        $this->assertCount(2, $payments);
        foreach ($payments as $p) {
            $this->postJson('/api/payments/fake/callback', [
                'payment_id' => $p->id, 'status' => 'paid', 'amount' => $p->amount, 'currency' => 'AZN',
                'signature' => FakeGateway::sign($p->id, 'paid', (int) $p->amount, 'AZN'),
            ])->assertOk();
        }

        $b = Booking::query()->find($id);
        $this->assertSame([Booking::UPCOMING, 'paid'], [$b->status, $b->deposit_status]);
        $this->assertNull($payments[0]->fresh()->refunded_at);
        $this->assertNotNull($payments[1]->fresh()->refunded_at);

        // Cancelled in time: the deposit that is still held goes back.
        $this->postJson("/api/bookings/{$id}/cancel", [], $h)->assertOk()->assertJsonPath('deposit_status', 'refunded');
        $this->assertNotNull($payments[0]->fresh()->refunded_at);
    }

    public function test_review_codes_are_capped_per_day(): void
    {
        config(['usta.qr_reviews.codes_per_day' => 2]);
        $salon = $this->makeSalon();
        $h = $this->auth($salon->owner);
        $this->postJson('/api/business/review-codes', [], $h)->assertCreated();
        $this->postJson('/api/business/review-codes', [], $h)->assertCreated();
        $this->postJson('/api/business/review-codes', [], $h)->assertStatus(429)->assertJsonPath('error', 'code_limit');
        $this->travel(25)->hours();
        $this->postJson('/api/business/review-codes', [], $h)->assertCreated();
    }

    public function test_a_photo_that_unpacks_to_too_many_pixels_is_refused_before_decoding(): void
    {
        Storage::fake('public');
        $salon = $this->makeSalon();
        // A valid PNG header for 10 000 × 10 000 pixels, a few bytes long.
        $ihdr = pack('NNCCCCC', 10000, 10000, 8, 2, 0, 0, 0);
        $chunk = fn (string $type, string $data) => pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));
        $png = "\x89PNG\r\n\x1a\n".$chunk('IHDR', $ihdr).$chunk('IDAT', gzcompress(str_repeat("\0", 64))).$chunk('IEND', '');
        $file = UploadedFile::fake()->createWithContent('bomb.png', $png);

        $this->post('/api/business/photos', ['photo' => $file], $this->auth($salon->owner) + ['Accept' => 'application/json'])
            ->assertStatus(422)->assertJsonValidationErrors('photo');
    }

    public function test_api_answers_carry_security_headers(): void
    {
        $this->getJson('/api/plans')->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'no-referrer');
        $user = User::factory()->create();
        $res = $this->getJson('/api/me', $this->auth($user))->assertOk();
        $this->assertStringContainsString('no-store', (string) $res->headers->get('Cache-Control'));
    }

    public function test_city_wide_search_is_cached_until_a_booking_changes_it(): void
    {
        $salon = $this->makeSalon();
        $key = $salon->services()->first()->key;
        $first = $this->getJson("/api/slots?service_key={$key}&date=2026-10-13")->assertOk()->json();
        $this->assertNotEmpty($first);
        $start = $first[0]['start'];

        $client = User::factory()->create();
        $iso = Baku::date('2026-10-13')->addMinutes($start)->utc()->toIso8601ZuluString();
        $this->postJson('/api/bookings', [
            'salon_id' => $salon->id, 'master_id' => $first[0]['master_id'],
            'service_ids' => [$first[0]['service_id']], 'start' => $iso,
        ], $this->auth($client))->assertCreated();

        $after = $this->getJson("/api/slots?service_key={$key}&date=2026-10-13")->assertOk()->json();
        $this->assertNotSame($start, $after[0]['start'] ?? null);
        $this->assertInstanceOf(Business::class, $salon);
    }
}
