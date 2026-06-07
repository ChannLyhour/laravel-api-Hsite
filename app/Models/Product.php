<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\App;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'sku',
        'barcode',
        'status',
        'created_by',
        'has_options',
        'product_type',
        'brand_id',
        'unit',
        'search_tags',
        'min_order_qty',
        'discount_amount',
        'discount_type',
        'shipping_cost',
        'multiply_qty_shipping',
        'products_thumbnail',
    ];

    protected $casts = [
        'has_options' => 'boolean',
        'multiply_qty_shipping' => 'boolean',
        'min_order_qty' => 'integer',
        'brand_id' => 'integer',
        'discount_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'products_thumbnail' => 'array',
    ];

    protected $appends = [
        'name',
        'description',
        'slug',
        'display_image',
        'price',
        'image',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function translations()
    {
        return $this->hasMany(ProductTranslation::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function ratings()
    {
        return $this->hasMany(ProductRating::class);
    }

    public function likes()
    {
        return $this->morphMany(Like::class, 'likeable');
    }

    public function carts()
    {
        return $this->hasMany(Cart::class);
    }

    public function flashDeals()
    {
        return $this->belongsToMany(FlashDeal::class, 'flash_deal_product');
    }

    /**
     * Get the translated name for the current active locale.
     */
    public function getNameAttribute()
    {
        $locale = App::getLocale();
        $translation = $this->translations->where('locale', $locale)->first() 
            ?? $this->translations->where('locale', 'en')->first()
            ?? $this->translations->first();

        return $translation ? $translation->name : null;
    }

    /**
     * Get the translated description for the current active locale.
     */
    public function getDescriptionAttribute()
    {
        $locale = App::getLocale();
        $translation = $this->translations->where('locale', $locale)->first() 
            ?? $this->translations->where('locale', 'en')->first()
            ?? $this->translations->first();

        return $translation ? $translation->description : null;
    }

    /**
     * Get the translated slug for the current active locale.
     */
    public function getSlugAttribute()
    {
        $locale = App::getLocale();
        $translation = $this->translations->where('locale', $locale)->first() 
            ?? $this->translations->where('locale', 'en')->first()
            ?? $this->translations->first();

        return $translation ? $translation->slug : null;
    }

    /**
     * Get the primary display image path or fallback.
     */
    public function getDisplayImageAttribute()
    {
        if ($this->products_thumbnail && count($this->products_thumbnail) > 0) {
            $value = $this->products_thumbnail[0];
            if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://') || str_starts_with($value, 'data:')) {
                return $value;
            }
            return asset($value);
        }

        $primaryImage = $this->images->where('is_primary', true)->first() ?? $this->images->first();
        if ($primaryImage) {
            $img = $primaryImage->image;
            if (is_array($img)) {
                return $img[0] ?? asset('default.png');
            }
            return $img;
        }
        return asset('default.png');
    }

    /**
     * Get the price of the first variant.
     */
    public function getPriceAttribute()
    {
        $variant = $this->variants->first();
        return $variant ? $variant->retail_price : 0.00;
    }

    /**
     * Get display image alias.
     */
    public function getImageAttribute()
    {
        return $this->getDisplayImageAttribute();
    }

    /**
     * Synchronize the products_thumbnail JSON column based on associated images.
     */
    public function syncThumbnails()
    {
        $rawImages = \Illuminate\Support\Facades\DB::table('product_images')
            ->where('product_id', $this->id)
            ->orderByDesc('is_primary')
            ->orderBy('id')
            ->pluck('image')
            ->toArray();

        $paths = [];
        foreach ($rawImages as $imgGroup) {
            if (is_array($imgGroup)) {
                $paths = array_merge($paths, $imgGroup);
            } elseif (is_string($imgGroup)) {
                $decoded = json_decode($imgGroup, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $paths = array_merge($paths, $decoded);
                } elseif ($imgGroup !== '') {
                    $paths[] = $imgGroup;
                }
            }
        }

        $this->updateQuietly([
            'products_thumbnail' => $paths
        ]);
    }
}
