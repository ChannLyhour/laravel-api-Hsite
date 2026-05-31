<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\File;

class ProductImage extends Model
{
    use HasFactory;

    const UPDATED_AT = null;

    protected $fillable = [
        'product_id',
        'product_variant_id',
        'image_path',
        'is_primary',
        'sort_order',
        'created_by',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the full URL for the image path.
     */
    public function getImagePathAttribute($value)
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
        if (File::exists(public_path('uploads/' . $value))) {
            return asset('uploads/' . $value);
        }

        // If it resides in static/
        if (File::exists(public_path('static/' . $value))) {
            return asset('static/' . $value);
        }

        return asset($value);
    }
}
