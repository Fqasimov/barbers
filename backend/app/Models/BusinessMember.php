<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A manager the owner invited by email (Pro). Runs the calendar, masters,
 * services and reviews of one branch (branch_id) or every location (null);
 * never billing, branches or the team.
 */
class BusinessMember extends Model
{
    public const MANAGER = 'manager';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['accepted_at' => 'datetime'];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** May this member work on that location? */
    public function covers(Business $location): bool
    {
        return $this->branch_id === null || $this->branch_id === $location->id;
    }
}
