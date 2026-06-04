<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClearanceSale extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'is_active',
        'start_date',
        'end_date',
        'discount_type',
        'discount_amount',
        'discount_amount_type',
        'offer_active_time',
        'active_start_time',
        'active_end_time',
        'show_in_home_page',
        'meta_title',
        'meta_description',
        'meta_image',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'show_in_home_page' => 'boolean',
        'discount_amount' => 'decimal:2',
    ];

    protected $appends = [
        'status',
        'active_products',
    ];

    public function products()
    {
        return $this->belongsToMany(Product::class, 'clearance_sale_product')
            ->withPivot('discount_amount', 'discount_type', 'is_active')
            ->withTimestamps();
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Determine the status of the clearance sale: Active, Expired, or Upcoming.
     */
    public function getStatusAttribute(): string
    {
        $now = now();
        if ($now < $this->start_date) {
            return 'Upcoming';
        } elseif ($now > $this->end_date) {
            return 'Expired';
        } else {
            return 'Active';
        }
    }

    /**
     * Get the count of active products in the clearance sale.
     */
    public function getActiveProductsAttribute(): int
    {
        return $this->products()->count();
    }

    /**
     * Get the full URL for the meta image.
     */
    public function getMetaImageAttribute($value)
    {
        if (! $value) {
            return null;
        }

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://') || str_starts_with($value, 'data:')) {
            return $value;
        }

        return asset($value);
    }
}
