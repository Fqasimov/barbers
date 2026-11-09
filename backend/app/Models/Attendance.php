<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One shift a staff member clocked: check-in, and check-out once they leave. */
class Attendance extends Model
{
    use HasStringId;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['day' => 'date:Y-m-d', 'check_in_at' => 'datetime', 'check_out_at' => 'datetime'];
    }

    public function master(): BelongsTo
    {
        return $this->belongsTo(Master::class);
    }
}
