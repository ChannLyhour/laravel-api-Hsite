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
        'image_path' => 'array',
    ];

    protected static function booted()
    {
        static::saved(function ($image) {
            if ($image->product) {
                $image->product->syncThumbnails();
            }
        });
        static::deleted(function ($image) {
            if ($image->product) {
                $image->product->syncThumbnails();
            }
        });
    }

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
     * Set/mutate the image path attribute to store as JSON array.
     */
    public function setImagePathAttribute($value)
    {
        if (is_array($value)) {
            $this->attributes['image_path'] = json_encode(array_values($value));
        } elseif (is_string($value)) {
            if (str_starts_with($value, '[') || str_starts_with($value, '{')) {
                $this->attributes['image_path'] = $value;
            } else {
                $this->attributes['image_path'] = json_encode([$value]);
            }
        } else {
            $this->attributes['image_path'] = json_encode([]);
        }
    }

    /**
     * Get the full URL for the image path.
     */
    public function getImagePathAttribute($value)
    {
        $paths = [];
        if (is_array($value)) {
            $paths = $value;
        } elseif (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $paths = $decoded;
            } else {
                $paths = [$value];
            }
        }

        if (empty($paths)) {
            return [asset('default.png')];
        }

        return array_map(function ($path) {
            if (! $path) {
                return asset('default.png');
            }

            // If it's already a full URL or base64 data URL, return it directly
            if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://') || str_starts_with($path, 'data:')) {
                return $path;
            }

            // If it starts with uploads/ or static/, return the full asset URL
            if (str_starts_with($path, 'uploads/') || str_starts_with($path, 'static/')) {
                return asset($path);
            }

            // If it resides in uploads/
            if (File::exists(public_path('uploads/' . $path))) {
                return asset('uploads/' . $path);
            }

            // If it resides in static/
            if (File::exists(public_path('static/' . $path))) {
                return asset('static/' . $path);
            }

            return asset($path);
        }, $paths);
    }
}
