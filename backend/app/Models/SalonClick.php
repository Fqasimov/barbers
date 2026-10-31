<?php

namespace App\Models;

use App\Support\Baku;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/** Daily counts of what people tapped on a salon page (the monthly click report). */
class SalonClick extends Model
{
    public const KINDS = ['view', 'book', 'phone', 'whatsapp', 'directions'];

    public $timestamps = false;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['taps' => 'integer'];
    }

    public static function bump(string $businessId, string $kind): void
    {
        $day = Baku::today()->toDateString();
        DB::table('salon_clicks')->upsert(
            [['business_id' => $businessId, 'day' => $day, 'kind' => $kind, 'taps' => 1]],
            ['business_id', 'day', 'kind'],
            ['taps' => DB::raw('taps + 1')],
        );
    }
}
