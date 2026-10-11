<?php

namespace App\Services\Photos;

/**
 * GD re-encode. Writing a fresh JPEG from pixels drops every metadata block.
 * GD can't decode HEIC; with Imagick (libheif) installed, ImagickPhotoProcessor
 * is used instead and HEIC works.
 */
class GdPhotoProcessor implements PhotoProcessor
{
    public function toJpeg(string $path, int $maxPx): string
    {
        $bytes = @file_get_contents($path);
        $img = $bytes !== false ? @imagecreatefromstring($bytes) : false;
        if (! $img) {
            throw new UnsupportedPhoto('This image format is not supported. Upload a JPEG or PNG.');
        }

        $img = $this->orient($img, $path);
        $w = imagesx($img);
        $h = imagesy($img);
        $scale = min(1, $maxPx / max($w, $h));
        $nw = max(1, (int) round($w * $scale));
        $nh = max(1, (int) round($h * $scale));

        $out = imagecreatetruecolor($nw, $nh);
        // Flatten transparency (PNG) onto white.
        imagefill($out, 0, 0, imagecolorallocate($out, 255, 255, 255));
        imagecopyresampled($out, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
        imagedestroy($img);

        imageinterlace($out, true);
        ob_start();
        imagejpeg($out, null, 82);
        imagedestroy($out);

        return (string) ob_get_clean();
    }

    /** Applies the EXIF orientation before the EXIF block is thrown away. */
    private function orient(\GdImage $img, string $path): \GdImage
    {
        if (! function_exists('exif_read_data')) {
            return $img;
        }
        $exif = @exif_read_data($path);
        $o = is_array($exif) ? (int) ($exif['Orientation'] ?? 1) : 1;
        $rotated = match ($o) {
            3 => imagerotate($img, 180, 0),
            6 => imagerotate($img, -90, 0),
            8 => imagerotate($img, 90, 0),
            default => $img,
        };

        return $rotated ?: $img;
    }
}
