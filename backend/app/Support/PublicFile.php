<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/** Absolute URL of a file on the public photo disk (logos, master photos). */
class PublicFile
{
    public static function url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        $url = Storage::disk(config('usta.photo_disk'))->url($path);

        return str_starts_with($url, 'http') ? $url : url($url);
    }

    public static function delete(?string $path): void
    {
        if ($path) {
            Storage::disk(config('usta.photo_disk'))->delete($path);
        }
    }
}
