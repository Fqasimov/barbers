<?php

namespace App\Support;

/**
 * RFC 6238 time-based one-time codes (30 s, 6 digits, SHA-1): what Google
 * Authenticator, 1Password, Authy and the like generate.
 */
final class Totp
{
    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public static function newSecret(): string
    {
        $bytes = random_bytes(20);
        $bits = '';
        foreach (str_split($bytes) as $c) {
            $bits .= str_pad(decbin(ord($c)), 8, '0', STR_PAD_LEFT);
        }

        return implode('', array_map(fn ($chunk) => self::ALPHABET[bindec($chunk)], str_split($bits, 5)));
    }

    public static function uri(string $secret, string $email, string $issuer = 'Usta Admin'): string
    {
        return 'otpauth://totp/'.rawurlencode("{$issuer}:{$email}").'?'.http_build_query([
            'secret' => $secret, 'issuer' => $issuer, 'digits' => 6, 'period' => 30,
        ]);
    }

    public static function code(string $secret, int $step): string
    {
        $key = self::decode($secret);
        $hash = hash_hmac('sha1', pack('N*', 0, $step), $key, true);
        $offset = ord($hash[19]) & 0x0F;
        $value = ((ord($hash[$offset]) & 0x7F) << 24) | (ord($hash[$offset + 1]) << 16) | (ord($hash[$offset + 2]) << 8) | ord($hash[$offset + 3]);

        return str_pad((string) ($value % 1_000_000), 6, '0', STR_PAD_LEFT);
    }

    /**
     * The time step the code matches (allowing one step of clock drift either
     * way), or null. Steps at or before $lastStep are refused, so a code works once.
     */
    public static function verify(string $secret, string $code, ?int $lastStep, ?int $now = null): ?int
    {
        if (! preg_match('/^\d{6}$/', $code)) {
            return null;
        }
        $current = intdiv($now ?? time(), 30);
        foreach ([$current, $current - 1, $current + 1] as $step) {
            if (($lastStep === null || $step > $lastStep) && hash_equals(self::code($secret, $step), $code)) {
                return $step;
            }
        }

        return null;
    }

    private static function decode(string $secret): string
    {
        $bits = '';
        foreach (str_split(strtoupper(rtrim($secret, '='))) as $c) {
            $i = strpos(self::ALPHABET, $c);
            if ($i === false) {
                continue;
            }
            $bits .= str_pad(decbin($i), 5, '0', STR_PAD_LEFT);
        }

        return implode('', array_map(fn ($byte) => chr(bindec($byte)), array_filter(str_split($bits, 8), fn ($b) => strlen($b) === 8)));
    }
}
