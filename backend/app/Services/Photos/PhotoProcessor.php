<?php

namespace App\Services\Photos;

interface PhotoProcessor
{
    /**
     * Re-encodes an uploaded image as a JPEG no larger than $maxPx on its
     * longest side, upright, with all metadata (EXIF/GPS) dropped.
     *
     * @return string the JPEG bytes
     *
     * @throws UnsupportedPhoto when the image can't be decoded
     */
    public function toJpeg(string $path, int $maxPx): string;
}
