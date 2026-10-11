<?php

namespace App\Support;

use Illuminate\Support\Str;

/** Values the server derives when an owner hasn't set them. */
final class Catalogue
{
    public static function tone(string $id): string
    {
        $tones = config('usta.tones');

        return $tones[crc32($id) % count($tones)];
    }

    /** 1–3 from the average service price (AZN). */
    public static function priceLevel(array $prices): int
    {
        if ($prices === []) {
            return 2;
        }
        $avg = array_sum($prices) / count($prices);

        return $avg < 25 ? 1 : ($avg < 60 ? 2 : 3);
    }

    /** @param list<string> $categories */
    public static function kind(array $categories): array
    {
        $kinds = [
            'barber' => Loc::make('Bərbərxana', 'Барбершоп', 'Barbershop'),
            'hair' => Loc::make('Saç salonu', 'Салон причёсок', 'Hair salon'),
            'nails' => Loc::make('Dırnaq studiyası', 'Ногтевая студия', 'Nail studio'),
            'brows' => Loc::make('Qaş studiyası', 'Brow-бар', 'Brow bar'),
            'spa' => Loc::make('Spa', 'Спа', 'Spa'),
            'makeup' => Loc::make('Makiyaj studiyası', 'Студия макияжа', 'Makeup studio'),
        ];
        $categories = array_values(array_unique($categories));
        if (count($categories) === 1 && isset($kinds[$categories[0]])) {
            return $kinds[$categories[0]];
        }

        return Loc::make('Gözəllik salonu', 'Салон красоты', 'Beauty salon');
    }

    /**
     * The catalogue key shared across venues ("fade"), used by city-wide
     * search. Matched from keywords in any language, else a slug of the name.
     */
    public static function serviceKey(array $name): string
    {
        $text = mb_strtolower(implode(' ', array_filter($name)));
        $keywords = [
            'kids' => ['kid', 'child', 'uşaq', 'детск'],
            'fade' => ['fade', 'фейд'],
            'beard' => ['beard', 'saqqal', 'бород'],
            'shave' => ['shave', 'təraş', 'бритьё', 'бритье'],
            'pedi' => ['pedi', 'педикюр'],
            'gel' => ['gel', 'гель'],
            'mani' => ['mani', 'маникюр'],
            'lash' => ['lash', 'kirpik', 'ресниц'],
            'lami' => ['lamin', 'ламин'],
            'brow' => ['brow', 'qaş', 'бров'],
            'keratin' => ['keratin', 'кератин'],
            'balayage' => ['balayage', 'balyaj', 'балаяж'],
            'colour' => ['colour', 'color', 'boya', 'окраш'],
            'blow' => ['blow', 'fen', 'уклад'],
            'bridal' => ['bridal', 'gəlin', 'свадеб'],
            'evening' => ['evening', 'axşam', 'вечерн'],
            'massage' => ['massage', 'masaj', 'массаж'],
            'facial' => ['facial', 'üz ', 'лица'],
            'hammam' => ['hammam', 'hamam', 'хаммам'],
            'cut' => ['cut', 'kəsim', 'стрижк'],
        ];
        foreach ($keywords as $key => $words) {
            foreach ($words as $w) {
                if (str_contains($text, $w)) {
                    return $key;
                }
            }
        }
        $slug = Str::slug($name['en'] ?? $name['az'] ?? reset($name) ?: '');

        return Str::limit($slug !== '' ? $slug : 'service', 40, '');
    }
}
