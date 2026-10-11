<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Business;
use App\Models\Photo;
use App\Models\Review;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * DELETE /me (App Store 5.1.1(v)):
 *  - the user row and personal data, tokens, push tokens, OTPs: deleted
 *  - their upcoming bookings: cancelled by the customer, salons notified
 *  - past bookings and reviews: kept, anonymised ("Deleted user" / "İstifadəçi")
 *  - a business owner's salon: unpublished (soft-deleted), future bookings
 *    cancelled with customers notified, photos removed from storage
 */
class AccountDeletion
{
    public function __construct(private Notifier $notifier) {}

    public function delete(User $user): void
    {
        $toSalons = collect();
        $toCustomers = collect();
        $photoFiles = [];

        DB::transaction(function () use ($user, &$toSalons, &$toCustomers, &$photoFiles) {
            $now = now();

            // Their own upcoming visits.
            $mine = Booking::query()->where('user_id', $user->id)->where('status', Booking::UPCOMING)
                ->where('start_at', '>', $now)->lockForUpdate()->get();
            foreach ($mine as $b) {
                $b->forceFill(['status' => Booking::CANCELLED, 'cancelled_by' => 'customer', 'cancelled_at' => $now])->save();
            }
            $toSalons = $mine->pluck('id');

            // Their salon, if they own one.
            $business = Business::query()->where('owner_id', $user->id)->first();
            if ($business) {
                $future = Booking::query()->where('business_id', $business->id)->where('status', Booking::UPCOMING)
                    ->where('start_at', '>', $now)->where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', '!=', $user->id))
                    ->lockForUpdate()->get();
                foreach ($future as $b) {
                    $b->forceFill([
                        'status' => Booking::CANCELLED,
                        'cancelled_by' => 'salon',
                        'cancel_reason' => 'The salon closed its account.',
                        'cancelled_at' => $now,
                    ])->save();
                }
                $toCustomers = $future->pluck('id');

                foreach (Photo::query()->where('business_id', $business->id)->get() as $photo) {
                    $photoFiles[] = $photo;
                    $photo->delete();
                }
                Subscription::query()->where('business_id', $business->id)->update(['status' => Subscription::EXPIRED]);
                $business->forceFill(['status' => Business::SUSPENDED, 'owner_id' => null])->save();
                $business->delete(); // soft delete: history stays for customers' past bookings
            }

            // Anonymise what stays.
            Review::query()->where('user_id', $user->id)->update(['author' => 'İstifadəçi', 'user_id' => null]);
            Booking::query()->where('user_id', $user->id)->update(['user_id' => null]);

            DB::table('one_time_codes')->where('email', $user->email)->delete();
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            $user->tokens()->delete();
            $user->pushTokens()->delete();
            $user->delete();
        });

        foreach ($photoFiles as $photo) {
            $photo->deleteFile();
        }
        foreach (Booking::query()->whereIn('id', $toSalons)->get() as $b) {
            $this->notifier->bookingCancelledByCustomer($b);
        }
        foreach (Booking::query()->whereIn('id', $toCustomers)->get() as $b) {
            $this->notifier->bookingCancelledBySalon($b);
        }
    }
}
