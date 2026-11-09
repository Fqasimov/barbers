<?php

namespace App\Support;

use App\Services\Photos\PhotoProcessor;
use App\Services\Photos\UnsupportedPhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/** Validates the `photo` file of a request, re-encodes it as JPEG (drops GPS) and stores it. Returns the path. */
class PhotoUpload
{
    public const MAX_PIXELS = 50_000_000;

    public static function rules(): array
    {
        return ['photo' => ['required', 'file', 'max:8192', 'mimetypes:image/jpeg,image/png,image/heic,image/heif', 'extensions:jpg,jpeg,png,heic,heif']];
    }

    public static function store(Request $request, PhotoProcessor $processor, string $dir, int $maxPx): string
    {
        $request->validate(self::rules());
        $file = $request->file('photo')->getRealPath();
        // A small file can still unpack to gigabytes of pixels; refuse before decoding.
        $size = @getimagesize($file);
        if ($size && $size[0] * $size[1] > self::MAX_PIXELS) {
            throw ValidationException::withMessages(['photo' => ['This photo is too large. Use one under 50 megapixels.']]);
        }
        try {
            $jpeg = $processor->toJpeg($file, $maxPx);
        } catch (UnsupportedPhoto $e) {
            throw ValidationException::withMessages(['photo' => [$e->getMessage()]]);
        }
        $path = trim($dir, '/').'/'.strtolower((string) Str::ulid()).'.jpg';
        Storage::disk(config('usta.photo_disk'))->put($path, $jpeg, ['visibility' => 'public']);

        return $path;
    }
}
