<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'phone',
        'address',
        'city',
        'state',
        'image',
        'created_by',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function store()
    {
        return $this->hasOne(Store::class, 'created_by');
    }

    /**
     * Normalize password hashes starting with $2b$ to $2y$ so that Laravel's BcryptHasher accepts them.
     */
    public function getPasswordAttribute($value)
    {
        if (is_string($value) && str_starts_with($value, '$2b$')) {
            return '$2y$' . substr($value, 4);
        }
        return $value;
    }

    /**
     * Get the full URL for the user avatar image.
     */
    public function getImageAttribute($value)
    {
        if (! $value) {
            return asset('default.png');
        }

        // If it's already a full URL or base64 data URL, return it directly
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://') || str_starts_with($value, 'data:')) {
            return $value;
        }

        // If it starts with uploads/ or static/, return the full asset URL
        if (str_starts_with($value, 'uploads/') || str_starts_with($value, 'static/')) {
            return asset($value);
        }

        // If it resides in uploads/
        if (\Illuminate\Support\Facades\File::exists(public_path('uploads/' . $value))) {
            return asset('uploads/' . $value);
        }

        // If it resides in static/
        if (\Illuminate\Support\Facades\File::exists(public_path('static/' . $value))) {
            return asset('static/' . $value);
        }

        // Fallback to static if not found
        return asset('static/' . $value);
    }
}
