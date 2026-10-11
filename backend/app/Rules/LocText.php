<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** A Loc: a plain string, or an object with any of az/ru/en (at least one non-empty). */
class LocText implements ValidationRule
{
    public function __construct(private int $max = 255) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (is_string($value)) {
            if (trim($value) === '') {
                $fail('The :attribute field is required.');
            } elseif (mb_strlen($value) > $this->max) {
                $fail("The :attribute may not be longer than {$this->max} characters.");
            }

            return;
        }
        if (! is_array($value) || array_is_list($value) && $value !== []) {
            $fail('The :attribute must be text or an object with az, ru and en.');

            return;
        }
        $any = false;
        foreach ($value as $lang => $text) {
            if (! in_array($lang, ['az', 'ru', 'en'], true) || ($text !== null && ! is_string($text))) {
                $fail('The :attribute must only have az, ru and en texts.');

                return;
            }
            if (is_string($text) && mb_strlen($text) > $this->max) {
                $fail("The :attribute may not be longer than {$this->max} characters.");

                return;
            }
            $any = $any || (is_string($text) && trim($text) !== '');
        }
        if (! $any) {
            $fail('The :attribute field is required.');
        }
    }
}
