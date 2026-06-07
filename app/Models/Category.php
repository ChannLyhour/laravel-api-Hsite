<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'status',
        'is_menu',
        'created_by',
        'parent_id',
        'priority',
        'image',
    ];

    protected $casts = [
        'status' => 'boolean',
        'is_menu' => 'boolean',
        'priority' => 'integer',
    ];

    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get the full URL for the category image.
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

        return asset($value);
    }
}
