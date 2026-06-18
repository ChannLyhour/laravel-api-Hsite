<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FlashDeal extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'start_date',
        'end_date',
        'image',
        'meta_title',
        'meta_description',
        'meta_image',
        'is_published',
        'created_by',
        'priority',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_published' => 'boolean',
    ];

    protected $appends = [
        'status',
        'active_products',
    ];

    public function products()
    {
        return $this->belongsToMany(Product::class, 'flash_deal_product')
            ->withPivot('id')
            ->withTimestamps()
            ->orderByPivot('id', 'asc');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Determine the status of the flash deal: Active, Expired, or Upcoming.
     */
    public function getStatusAttribute(): string
    {
        $today = now()->toDateString();
        $start = $this->start_date->toDateString();
        $end = $this->end_date->toDateString();

        if ($today < $start) {
            return 'Upcoming';
        } elseif ($today > $end) {
            return 'Expired';
        } else {
            return 'Active';
        }
    }

    /**
     * Get the count of active products.
     */
    public function getActiveProductsAttribute(): int
    {
        return $this->products()->count();
    }

    /**
     * Get the full URL for the image.
     */
    public function getImageAttribute($value)
    {
        if (! $value) {
            return null;
        }

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://') || str_starts_with($value, 'data:')) {
            return $value;
        }

        return asset($value);
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
