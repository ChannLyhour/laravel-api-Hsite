<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'store_id',
        'name',
        'first_name',
        'last_name',
        'gender',
        'email',
        'phone',
        'address',
        'city',
        'country',
        'created_by',
    ];

    protected $appends = ['image'];

    public function getImageAttribute()
    {
        return $this->user ? $this->user->image : null;
    }
    

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The store (owner) this customer belongs to.
     * store_id references the store owner's user_id.
     */
    public function storeOwner()
    {
        return $this->belongsTo(User::class, 'store_id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function ratings()
    {
        return $this->hasMany(ProductRating::class);
    }
}
