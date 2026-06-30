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
        'first_name',
        'last_name',
        'gender',
        'email',
        'password',
        'role_id',
        'phone',
        'address',
        'city',
        'country',
        'state',
        'image',
        'created_by',
        'is_online',
        'last_seen_at',
    ];

    // Relationship to Customer (a user can be a customer in multiple stores)
    public function customers()
    {
        return $this->hasMany(Customer::class, 'user_id');
    }

    /**
     * Get the customer record for a specific store.
     *
     * @param int $storeId The store owner's user_id
     * @return \App\Models\Customer|null
     */
    public function customerForStore($storeId)
    {
        return $this->customers()->where('store_id', $storeId)->first();
    }

    // Relationship to Shipping Addresses
    public function shippingAddresses()
    {
        return $this->hasMany(ShippingAddress::class);
    }

    public function defaultShippingAddress()
    {
        return $this->hasOne(ShippingAddress::class)->where('set_as_default', true);
    }

    public function carts()
    {
        return $this->hasMany(Cart::class);
    }

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
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'hashid',
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
            'is_online' => 'boolean',
            'last_seen_at' => 'datetime',
        ];
    }

    /**
     * Get is_online status with inactivity timeout.
     */
    public function getIsOnlineAttribute($value)
    {
        if (!$value) {
            return false;
        }
        if (!$this->last_seen_at) {
            return false;
        }
        // If last seen is older than 3 minutes, consider offline
        return $this->last_seen_at->gt(now()->subMinutes(3));
    }

    /**
     * Conversations this user is participating in.
     */
    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'participants')
            ->withPivot(['role', 'joined_at', 'last_read_message_id']);
    }

    /**
     * Messages sent by this user.
     */
    public function messages()
    {
        return $this->hasMany(Message::class, 'sender_id');
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

    /**
     * Get the obfuscated/encrypted hashid for the user.
     */
    public function getHashidAttribute()
    {
        return \Vinkla\Hashids\Facades\Hashids::encode($this->id);
    }

    /**
     * Relationship: templates purchased by the user
     */
    public function templatePurchases()
    {
        return $this->hasMany(TemplatePurchase::class);
    }

    /**
     * Relationship: download tokens generated by the user
     */
    public function templateDownloadTokens()
    {
        return $this->hasMany(TemplateDownloadToken::class);
    }
}

