<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

/**
 * Usta staff, signed in to /admin with a password and a TOTP code.
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $totp_secret
 * @property ?int $totp_last_step
 */
class Admin extends Authenticatable
{
    protected $fillable = ['name', 'email'];

    protected $hidden = ['password', 'totp_secret'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'totp_secret' => 'encrypted',
            'last_login_at' => 'datetime',
            'disabled_at' => 'datetime',
        ];
    }

    public function getRememberTokenName(): ?string
    {
        return null; // no "remember me" for staff
    }
}
