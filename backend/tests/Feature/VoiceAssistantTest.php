<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Business;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** Voice assistant add-on: the ElevenLabs agent's tools check a time and book after the caller presses 1. */
class VoiceAssistantTest extends TestCase
{
    private Business $salon;

    private array $h = ['X-Voice-Secret' => 'test-secret'];

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        config(['usta.voice.secret' => 'test-secret']);
        // Monday 16 November 2026, 08:00 in Baku.
        $this->travelTo(CarbonImmutable::parse('2026-11-16 08:00', 'Asia/Baku'));
        $this->salon = $this->makeSalon();
        $this->salon->forceFill(['voice_until' => now()->addDays(30)])->save();
    }

    private function url(string $tool): string
    {
        return "/api/voice/{$this->salon->id}/{$tool}";
    }

    public function test_needs_the_secret_and_the_add_on(): void
    {
        $this->postJson($this->url('info'))->assertForbidden();
        $this->postJson($this->url('info'), [], ['X-Voice-Secret' => 'wrong'])->assertForbidden();
        $this->postJson($this->url('info'), [], $this->h)->assertOk()
            ->assertJsonPath('salon', 'Test Barbers')
            ->assertJsonPath('services.0.name', 'Kəsim')
            ->assertJsonPath('masters.0.name', 'Rauf Məmmədov');

        $this->salon->forceFill(['voice_until' => now()->subDay()])->save();
        $this->postJson($this->url('info'), [], $this->h)->assertNotFound();
    }

    public function test_checks_a_free_time_by_service_name(): void
    {
        $this->postJson($this->url('check'), ['service' => 'kəsim', 'date' => '2026-11-17', 'time' => '11:00'], $this->h)
            ->assertOk()
            ->assertJsonPath('available', true)
            ->assertJsonPath('master', 'Rauf Məmmədov')
            ->assertJsonPath('say', 'Kəsim sabah saat 11:00-da boşdur, usta Rauf Məmmədov. Təsdiq etmək üçün telefonda 1 düyməsini basın.');

        // Unknown service: the agent hears the list.
        $this->postJson($this->url('check'), ['service' => 'manikür', 'date' => '2026-11-17', 'time' => '11:00'], $this->h)
            ->assertOk()->assertJsonPath('service_unclear', true);
    }

    public function test_a_taken_time_offers_the_nearest_free_ones(): void
    {
        $this->postJson($this->url('book'), [
            'service' => 'Kəsim', 'date' => '2026-11-17', 'time' => '11:00', 'client_name' => 'Elvin', 'confirm_digit' => '1',
        ], $this->h)->assertCreated();

        $res = $this->postJson($this->url('check'), ['service' => 'Kəsim', 'date' => '2026-11-17', 'time' => '11:00'], $this->h)
            ->assertOk()->assertJsonPath('available', false);
        $times = array_column($res->json('alternatives'), 'time');
        $this->assertCount(3, $times);
        $this->assertNotContains('11:00', $times);
        $this->assertContains('12:00', $times);
        // Sunday 22nd: the salon is closed, and Monday the 23rd is past the 7-day booking window.
        $this->postJson($this->url('check'), ['service' => 'Kəsim', 'date' => '2026-11-22', 'time' => '11:00'], $this->h)
            ->assertOk()->assertJsonPath('available', false)->assertJsonPath('alternatives', [])
            ->assertJsonPath('say', 'Təəssüf, yaxın günlərdə bu xidmət üçün boş vaxt yoxdur.');
        // Saturday 21st at 09:00 is before the salon opens: the nearest free times that day.
        $this->postJson($this->url('check'), ['service' => 'Kəsim', 'date' => '2026-11-21', 'time' => '09:00'], $this->h)
            ->assertOk()->assertJsonPath('available', false)->assertJsonPath('alternatives.0.date', '2026-11-21');
    }

    public function test_books_only_after_pressing_one(): void
    {
        $ask = ['service' => 'Kəsim', 'date' => '2026-11-17', 'time' => '15:30', 'client_name' => 'Aysel', 'caller_phone' => '+994 50 123 45 67'];
        $this->postJson($this->url('book'), $ask + ['confirm_digit' => '2'], $this->h)->assertOk()->assertJsonPath('booked', false);
        $this->assertSame(0, Booking::query()->count());

        $this->postJson($this->url('book'), $ask + ['confirm_digit' => '1'], $this->h)->assertCreated()->assertJsonPath('booked', true);
        $b = Booking::query()->sole();
        $this->assertSame('voice', $b->source);
        $this->assertSame('Aysel', $b->client_name);
        $this->assertSame('994501234567', $b->client_phone);
        $this->assertSame('2026-11-17 15:30', CarbonImmutable::parse($b->start_at)->setTimezone('Asia/Baku')->format('Y-m-d H:i'));

        // The same time again is taken.
        $this->postJson($this->url('book'), $ask + ['confirm_digit' => '1'], $this->h)->assertOk()->assertJsonPath('booked', false);
    }
}
