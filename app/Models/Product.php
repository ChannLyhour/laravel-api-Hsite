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
    ];

    protected $casts = [
        'has_options' => 'boolean',
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
        $primaryImage = $this->images->where('is_primary', true)->first() ?? $this->images->first();
        if ($primaryImage) {
            return $primaryImage->image_path;
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
}
