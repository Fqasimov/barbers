<?php

use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\BookingController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\ReviewController;
use App\Http\Controllers\Admin\SalonController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Middleware\AdminAuthenticate;
use App\Http\Middleware\AdminSecurityHeaders;
use Illuminate\Support\Facades\Route;

// The admin panel for Usta staff: server-rendered, session + CSRF, password + TOTP.
Route::prefix('admin')->name('admin.')->middleware(AdminSecurityHeaders::class)->group(function () {
    Route::get('login', [AuthController::class, 'show'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->name('login.attempt');

    Route::middleware(AdminAuthenticate::class)->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        Route::get('salons', [SalonController::class, 'index'])->name('salons');
        Route::get('salons/{id}', [SalonController::class, 'show'])->name('salons.show');
        Route::post('salons/{id}/approve', [SalonController::class, 'approve'])->name('salons.approve');
        Route::post('salons/{id}/suspend', [SalonController::class, 'suspend'])->name('salons.suspend');
        Route::post('salons/{id}/extend', [SalonController::class, 'extend'])->name('salons.extend');
        Route::post('salons/{id}/plan', [SalonController::class, 'plan'])->name('salons.plan');

        Route::get('users', [UserController::class, 'index'])->name('users');
        Route::get('users/{id}', [UserController::class, 'show'])->name('users.show');
        Route::post('users/{id}/sign-out', [UserController::class, 'signOut'])->name('users.signout');
        Route::post('users/{id}/delete', [UserController::class, 'destroy'])->name('users.delete');

        Route::get('bookings', [BookingController::class, 'index'])->name('bookings');

        Route::get('reviews', [ReviewController::class, 'index'])->name('reviews');
        Route::post('reviews/{id}/hide', [ReviewController::class, 'hide'])->name('reviews.hide');
        Route::post('reviews/{id}/restore', [ReviewController::class, 'restore'])->name('reviews.restore');
        Route::post('reviews/{id}/dismiss', [ReviewController::class, 'dismiss'])->name('reviews.dismiss');

        Route::get('payments', [PaymentController::class, 'index'])->name('payments');
        Route::get('activity', [ActivityController::class, 'index'])->name('activity');
    });
});
