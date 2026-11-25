<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One call the voice assistant answered, as ElevenLabs reported it after the call. */
class VoiceCall extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['started_at' => 'datetime', 'seconds' => 'integer'];
    }
}
