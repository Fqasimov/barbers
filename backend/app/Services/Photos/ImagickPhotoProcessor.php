<?php

namespace App\Services\Photos;

/** Used when the imagick extension is loaded (handles HEIC if ImageMagick has libheif). */
class ImagickPhotoProcessor implements PhotoProcessor
{
    public function toJpeg(string $path, int $maxPx): string
    {
        try {
            $im = new \Imagick($path);
            $im->setIteratorIndex(0);
            if (method_exists($im, 'autoOrient')) {
                $im->autoOrient();
            }
            $im->setImageBackgroundColor('white');
            $im = $im->mergeImageLayers(\Imagick::LAYERMETHOD_FLATTEN);
            if (max($im->getImageWidth(), $im->getImageHeight()) > $maxPx) {
                $im->thumbnailImage($maxPx, $maxPx, true);
            }
            $im->stripImage();
            $im->setImageFormat('jpeg');
            $im->setImageCompressionQuality(82);
            $blob = $im->getImagesBlob();
            $im->clear();

            return $blob;
        } catch (\Throwable) {
            throw new UnsupportedPhoto('This image format is not supported. Upload a JPEG or PNG.');
        }
    }
}
