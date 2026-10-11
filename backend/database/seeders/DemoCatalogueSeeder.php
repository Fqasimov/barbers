<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Master;
use App\Models\Review;
use App\Models\Service;
use App\Models\Subscription;
use App\Models\User;
use App\Services\RatingService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * The app's 15 fictional venues and 86 reviews (data/demo-catalogue.json,
 * exported by the app with camelCase keys). Ids are kept as in the app.
 * Each salon gets a placeholder owner (no password, can't sign in), is live
 * and has an active subscription. The app's aggregate ratings are kept as a
 * base, so the numbers match the app with the sample reviews on top.
 */
class DemoCatalogueSeeder extends Seeder
{
    public function run(RatingService $ratings): void
    {
        $data = json_decode(file_get_contents(__DIR__.'/data/demo-catalogue.json'), true, flags: JSON_THROW_ON_ERROR);
        $reviewsBySalon = collect($data['reviews'])->groupBy('salonId');
        $reviewsByMaster = collect($data['reviews'])->filter(fn ($r) => ! empty($r['masterId']))->groupBy('masterId');
        $now = now();

        DB::transaction(function () use ($data, $reviewsBySalon, $reviewsByMaster, $now, $ratings) {
            foreach ($data['salons'] as $i => $s) {
                $owner = User::query()->firstOrNew(['email' => "owner+{$s['id']}@demo.usta.invalid"]);
                $owner->forceFill([
                    'first_name' => 'Demo',
                    'last_name' => 'Owner',
                    'role' => 'business',
                    'provider' => 'password',
                    'password' => null,
                    'email_verified_at' => $now,
                ])->save();

                $own = $reviewsBySalon->get($s['id'], collect());
                [$baseRating, $baseCount] = $this->base((float) $s['rating'], (int) $s['reviewCount'], $own);

                $business = Business::withTrashed()->firstOrNew(['id' => $s['id']]);
                $business->forceFill([
                    'owner_id' => $owner->id,
                    'name' => $s['name'],
                    'kind' => $s['kind'],
                    'categories' => $s['categories'],
                    'tagline' => $s['tagline'],
                    'about' => $s['about'],
                    'address' => $s['address'],
                    'district' => $s['district'],
                    'latitude' => $s['coords']['latitude'],
                    'longitude' => $s['coords']['longitude'],
                    'price_level' => $s['priceLevel'],
                    'tone' => $s['tone'],
                    'audience' => ! empty($s['womenOnly']) ? 'women' : 'all',
                    'hours_open' => $s['hours']['open'],
                    'hours_close' => $s['hours']['close'],
                    'closed_days' => $s['closedDays'],
                    'phone' => $s['phone'],
                    'whatsapp' => $s['whatsapp'],
                    'amenities' => $s['amenities'],
                    'base_rating' => $baseRating,
                    'base_review_count' => $baseCount,
                    'base_distribution' => $s['distribution'] ?? null,
                    'status' => Business::LIVE,
                    'approved_at' => $now,
                    'deleted_at' => null,
                ])->save();

                Subscription::query()->updateOrCreate(['business_id' => $business->id], [
                    'plan' => 'pro',
                    'status' => Subscription::ACTIVE,
                    'started_at' => $now,
                    'trial_ends_at' => $now,
                    'current_period_end' => $now->copy()->addYear(),
                ]);

                foreach ($s['services'] as $pos => $sv) {
                    $service = Service::query()->firstOrNew(['id' => $sv['id']]);
                    $service->forceFill([
                        'business_id' => $business->id,
                        'key' => $sv['key'],
                        'name' => $sv['name'],
                        'description' => $sv['description'] ?? null,
                        'category' => $sv['category'],
                        'duration_min' => $sv['durationMin'],
                        'price' => $sv['price'],
                        'position' => $pos,
                    ])->save();
                }

                foreach ($s['masters'] as $pos => $m) {
                    [$mRating, $mCount] = $this->base((float) $m['rating'], (int) $m['reviewCount'], $reviewsByMaster->get($m['id'], collect()));
                    $master = Master::query()->firstOrNew(['id' => $m['id']]);
                    $master->forceFill([
                        'business_id' => $business->id,
                        'name' => $m['name'],
                        'role' => $m['role'],
                        'years' => $m['years'],
                        'work_days' => $m['workDays'],
                        'shift_start' => $m['shift']['start'],
                        'shift_end' => $m['shift']['end'],
                        'tone' => $m['tone'],
                        'languages' => $m['languages'],
                        'base_rating' => $mRating,
                        'base_review_count' => $mCount,
                        'position' => $pos,
                    ])->save();
                    $master->services()->sync($m['serviceIds']);
                }

                foreach ($own as $r) {
                    $review = Review::query()->firstOrNew(['id' => $r['id']]);
                    $date = CarbonImmutable::parse($r['date'])->utc();
                    $review->forceFill([
                        'business_id' => $business->id,
                        'master_id' => $r['masterId'] ?? null,
                        'author' => Str::limit($r['author'], 80, ''),
                        'rating' => $r['rating'],
                        'text' => $r['text'],
                        'tags' => $r['tags'] ?? [],
                        'service_name' => $r['serviceName'] ?? null,
                        'created_at' => $date,
                        'updated_at' => $date,
                    ])->save();
                }

                $ratings->refreshBusiness($business);
                foreach ($business->masters()->get() as $master) {
                    $ratings->refreshMaster($master);
                }
            }
        });
    }

    /**
     * The aggregate before the sample reviews, so base + samples reproduces
     * the app's rating and count exactly.
     *
     * @return array{0: float, 1: int}
     */
    private function base(float $rating, int $count, $reviews): array
    {
        $n = $reviews->count();
        $baseCount = max(0, $count - $n);
        if ($baseCount === 0) {
            return [0.0, 0];
        }
        $baseRating = ($rating * $count - $reviews->sum('rating')) / $baseCount;

        return [round(max(1, min(5, $baseRating)), 3), $baseCount];
    }
}
