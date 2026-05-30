<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'description',
        'price',
        'image',
        'status',
        'created_by',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function ratings()
    {
        return $this->hasMany(MenuItemRating::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function likes()
    {
        return $this->morphMany(Like::class, 'likeable');
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get the full URL for the menu item image.
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
}
