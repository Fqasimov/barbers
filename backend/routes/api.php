<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\Business\AddonController;
use App\Http\Controllers\Business\BranchController;
use App\Http\Controllers\Business\BusinessBookingController;
use App\Http\Controllers\Business\BusinessController;
use App\Http\Controllers\Business\BusinessReviewController;
use App\Http\Controllers\Business\InsightsController;
use App\Http\Controllers\Business\MasterController;
use App\Http\Controllers\Business\PhotoController;
use App\Http\Controllers\Business\ReviewCodeController;
use App\Http\Controllers\Business\ServiceController;
use App\Http\Controllers\Business\SubscriptionController;
use App\Http\Controllers\Business\TeamController;
use App\Http\Controllers\CatalogueController;
use App\Http\Controllers\MeController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\QrReviewController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\SocialAuthController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\WaitlistController;
use Illuminate\Support\Facades\Route;

// Accounts (rate-limited per IP and per email)
Route::middleware('throttle:auth')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('business/register', [AuthController::class, 'registerBusiness']);
    Route::post('auth/email/verify', [AuthController::class, 'verifyEmail']);
    Route::post('auth/otp/resend', [AuthController::class, 'resend']);
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/password/forgot', [AuthController::class, 'forgot']);
    Route::post('auth/password/verify', [AuthController::class, 'verifyReset']);
    Route::post('auth/password/reset', [AuthController::class, 'reset']);
    Route::post('auth/social/google', [SocialAuthController::class, 'google']);
    Route::post('auth/social/apple', [SocialAuthController::class, 'apple']);
});

// Catalogue (public)
Route::middleware('throttle:public')->group(function () {
    Route::get('salons', [CatalogueController::class, 'salons']);
    Route::get('salons/{id}', [CatalogueController::class, 'salon']);
    Route::get('salons/{id}/reviews', [CatalogueController::class, 'reviews']);
    Route::get('salons/{id}/availability', [CatalogueController::class, 'availability']);
    Route::get('slots', [CatalogueController::class, 'slots']);
    Route::get('busy', [CatalogueController::class, 'busy']);
    Route::get('plans', [CatalogueController::class, 'plans']);
    Route::post('salons/{id}/click', [CatalogueController::class, 'click'])->middleware('throttle:60,1');
    Route::get('reviews/qr/{code}', [QrReviewController::class, 'show']);
    Route::get('stats', StatsController::class);
});

// Payment provider → server
Route::post('payments/{provider}/callback', [PaymentController::class, 'callback'])
    ->middleware('throttle:public')->where('provider', '[a-z0-9_-]+');

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::get('me', [MeController::class, 'show']);
    Route::patch('me', [MeController::class, 'update']);
    Route::delete('me', [MeController::class, 'destroy']);
    Route::post('me/push-tokens', [MeController::class, 'storePushToken']);
    Route::delete('me/push-tokens', [MeController::class, 'destroyPushToken']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::get('bookings', [BookingController::class, 'index']);
    Route::post('bookings', [BookingController::class, 'store'])->middleware('throttle:bookings');
    Route::post('bookings/{id}/cancel', [BookingController::class, 'cancel']);
    Route::post('bookings/{id}/review', [BookingController::class, 'review']);
    Route::post('bookings/{id}/pay', [BookingController::class, 'pay'])->middleware('throttle:bookings');
    Route::post('reviews/qr/{code}', [QrReviewController::class, 'store'])->middleware('throttle:bookings');
    Route::get('me/waitlist', [WaitlistController::class, 'index']);
    Route::post('salons/{id}/waitlist', [WaitlistController::class, 'store'])->middleware('throttle:bookings');
    Route::delete('me/waitlist/{id}', [WaitlistController::class, 'destroy']);
    Route::post('reviews/{id}/report', [ReviewController::class, 'report'])->middleware('throttle:bookings');

    Route::middleware('business')->prefix('business')->group(function () {
        Route::get('/', [BusinessController::class, 'show']);
        Route::patch('/', [BusinessController::class, 'update']);

        Route::post('masters', [MasterController::class, 'store']);
        Route::patch('masters/{id}', [MasterController::class, 'update']);
        Route::delete('masters/{id}', [MasterController::class, 'destroy']);

        Route::post('services', [ServiceController::class, 'store']);
        Route::patch('services/{id}', [ServiceController::class, 'update']);
        Route::delete('services/{id}', [ServiceController::class, 'destroy']);

        Route::post('photos', [PhotoController::class, 'store']);
        Route::delete('photos/{id}', [PhotoController::class, 'destroy']);

        Route::get('bookings', [BusinessBookingController::class, 'index']);
        Route::post('bookings', [BusinessBookingController::class, 'store']);
        Route::post('blocks', [BusinessBookingController::class, 'block']);
        Route::post('bookings/{id}/cancel', [BusinessBookingController::class, 'cancel']);
        Route::post('bookings/{id}/complete', [BusinessBookingController::class, 'complete']);
        Route::post('bookings/{id}/no-show', [BusinessBookingController::class, 'noShow']);

        Route::get('reviews', [BusinessReviewController::class, 'index']);
        Route::post('reviews/{id}/reply', [BusinessReviewController::class, 'reply']);

        Route::post('review-codes', [ReviewCodeController::class, 'store']);

        Route::get('branches', [BranchController::class, 'index']);
        Route::post('branches', [BranchController::class, 'store']);
        Route::delete('branches/{id}', [BranchController::class, 'destroy']);
        Route::get('team', [TeamController::class, 'index']);
        Route::post('team', [TeamController::class, 'store']);
        Route::delete('team/{id}', [TeamController::class, 'destroy']);

        Route::get('stats', [InsightsController::class, 'stats']);
        Route::get('clicks', [InsightsController::class, 'clicks']);
        Route::get('waitlist', [InsightsController::class, 'waitlist']);

        Route::post('whatsapp/checkout', [AddonController::class, 'whatsapp']);
        Route::get('support', [AddonController::class, 'support']);

        Route::get('subscription', [SubscriptionController::class, 'show']);
        Route::post('subscription/trial', [SubscriptionController::class, 'trial']);
        Route::post('subscription/checkout', [SubscriptionController::class, 'checkout']);
    });
});
