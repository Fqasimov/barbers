<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Support\CatalogueCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Photo extends Model
{
    use HasStringId;

    protected $guarded = [];

    protected static function booted(): void
    {
        static::saved(fn () => CatalogueCache::flush());
        static::deleted(fn () => CatalogueCache::flush());
    }

    public function url(): string
    {
        $url = Storage::disk($this->disk)->url($this->path);

        // Always absolute, even if a disk is configured with a relative URL.
        return str_starts_with($url, 'http') ? $url : url($url);
    }

    public function deleteFile(): void
    {
        Storage::disk($this->disk)->delete($this->path);
    }
}
