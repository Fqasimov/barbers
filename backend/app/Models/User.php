<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property string $id
 * @property string $first_name
 * @property string $last_name
 * @property string $email
 * @property ?string $phone
 * @property ?Carbon $birth_date
 * @property ?string $gender
 * @property string $role
 * @property string $provider
 * @property ?string $password
 * @property ?Carbon $email_verified_at
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasStringId, Notifiable;

    // Only set explicitly from validated data; never mass-assign roles or ids.
    protected $fillable = ['first_name', 'last_name', 'email', 'phone', 'birth_date', 'gender'];

    protected $hidden = ['password', 'remember_token', 'google_sub', 'apple_sub'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'birth_date' => 'date:Y-m-d',
            'password' => 'hashed',
        ];
    }

    public function business(): HasOne
    {
        return $this->hasOne(Business::class, 'owner_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function pushTokens(): HasMany
    {
        return $this->hasMany(PushToken::class);
    }

    public function isVerified(): bool
    {
        return $this->email_verified_at !== null;
    }

    /** "Aysel M." — how the user is shown as a review author. */
    public function shortName(): string
    {
        $last = mb_substr(trim($this->last_name), 0, 1);

        return trim($this->first_name.($last !== '' ? ' '.mb_strtoupper($last).'.' : ''));
    }

    public function fullName(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }
}
