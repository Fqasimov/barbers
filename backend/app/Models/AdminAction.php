<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;

/** The audit log: who changed what in the admin panel. */
class AdminAction extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['data' => 'array', 'created_at' => 'datetime'];
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }

    public static function record(Request $request, string $action, ?Model $subject, string $summary, array $data = []): self
    {
        $type = match (true) {
            $subject instanceof Business => 'salon',
            $subject instanceof User => 'user',
            $subject instanceof Review => 'review',
            $subject instanceof Admin => 'admin',
            default => null,
        };

        return static::query()->create([
            'admin_id' => $request->user('admin')?->id,
            'action' => $action,
            'subject_type' => $type,
            'subject_id' => $subject?->getKey(),
            'summary' => mb_strimwidth($summary, 0, 255, '…'),
            'data' => $data ?: null,
            'ip' => $request->ip(),
            'created_at' => now(),
        ]);
    }
}
