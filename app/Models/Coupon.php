<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'title',
        'code',
        'coupon_type',
        'vendor_id',
        'customer_id',
        'discount_type',
        'discount_amount',
        'minimum_purchase',
        'limit_same_user',
        'limit_total',
        'total_used',
        'start_date',
        'expire_date',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date'       => 'datetime',
            'expire_date'      => 'datetime',
            'is_active'        => 'boolean',
            'discount_amount'  => 'float',
            'minimum_purchase' => 'float',
        ];
    }

    /**
     * Vendor (seller) associated with this coupon.
     */
    public function vendor()
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    /**
     * Customer associated with this coupon (if customer-specific).
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /**
     * User who created this coupon.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
