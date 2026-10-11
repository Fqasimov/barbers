<?php

namespace App\Rules;

use Illuminate\Validation\Rules\Password;

/** Shared rules, mirroring the app's src/auth/validation.ts. */
final class V
{
    public const NAME = '/^\p{L}[\p{L}\p{M}\' -]{1,39}$/u';

    public const AZ_MOBILE = '/^\+994(10|50|51|55|60|70|77|99)\d{7}$/';

    /** Any Azerbaijani number (salon landlines included), E.164. */
    public const AZ_PHONE = '/^\+994\d{9}$/';

    public const CLOCK = '/^([01]\d|2[0-3]):[0-5]\d$/';

    public static function name(): array
    {
        return ['string', 'min:2', 'max:40', 'regex:'.self::NAME];
    }

    public static function phone(): array
    {
        return ['string', 'regex:'.self::AZ_MOBILE];
    }

    public static function birthDate(): array
    {
        return [
            'date_format:Y-m-d',
            'before_or_equal:'.now('Asia/Baku')->subYears(13)->toDateString(),
            'after:'.now('Asia/Baku')->subYears(110)->toDateString(),
        ];
    }

    public static function email(): array
    {
        return ['string', 'max:254', 'email:rfc'];
    }

    public static function password(): array
    {
        return ['string', 'max:64', Password::min(8)->letters()->numbers()];
    }

    public static function clock(): array
    {
        return ['string', 'regex:'.self::CLOCK];
    }
}
