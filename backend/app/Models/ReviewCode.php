<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A one-time QR the master shows after a visit; the client scans it to leave a review. */
class ReviewCode extends Model
{
    use HasStringId;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['expires_at' => 'datetime', 'used_at' => 'datetime'];
    }

    public static function hash(string $code): string
    {
        return hash('sha256', $code);
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function master(): BelongsTo
    {
        return $this->belongsTo(Master::class);
    }

    public function usable(): bool
    {
        return $this->used_at === null && $this->expires_at->isFuture();
    }
}
