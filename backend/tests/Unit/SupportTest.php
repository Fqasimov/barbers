<?php

namespace Tests\Unit;

use App\Support\Catalogue;
use App\Support\Loc;
use Tests\TestCase;

class SupportTest extends TestCase
{
    public function test_loc_fills_missing_languages(): void
    {
        $this->assertSame(['az' => 'Salam', 'ru' => 'Salam', 'en' => 'Salam'], Loc::from('Salam'));
        $this->assertSame(['az' => 'Привет', 'ru' => 'Привет', 'en' => 'Hi'], Loc::from(['ru' => 'Привет', 'en' => 'Hi', 'az' => '']));
        $this->assertNull(Loc::from(['az' => '  ']));
        $this->assertSame(['az' => '', 'ru' => '', 'en' => ''], Loc::fill(null));
    }

    public function test_service_keys_are_derived_from_names(): void
    {
        $this->assertSame('fade', Catalogue::serviceKey(['az' => 'Skin fade']));
        $this->assertSame('beard', Catalogue::serviceKey(['ru' => 'Оформление бороды']));
        $this->assertSame('kids', Catalogue::serviceKey(['en' => 'Kids cut']));
        $this->assertSame('cut', Catalogue::serviceKey(['az' => 'Klassik kəsim']));
        $this->assertSame('hot-stone', Catalogue::serviceKey(['en' => 'Hot stone']));
    }

    public function test_price_level_and_tone_are_deterministic(): void
    {
        $this->assertSame(1, Catalogue::priceLevel([20, 15]));
        $this->assertSame(2, Catalogue::priceLevel([30, 40]));
        $this->assertSame(3, Catalogue::priceLevel([150]));
        $this->assertSame(Catalogue::tone('abc'), Catalogue::tone('abc'));
    }
}
