<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Store extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'created_by',
        'store_name',
        'store_phone',
        'store_email',
        'store_address',
        'tax_percentage',
        'subscription_tier',
        'custom_domain',
        'logo_url',
        'social_tiktok',
        'social_facebook',
        'social_telegram',
    ];

    protected $casts = [
        'tax_percentage' => 'float',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
