<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductBadge extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'text_color',
        'background_color',
        'status',
        'priority',
        'created_by',
    ];

    protected $casts = [
        'status' => 'boolean',
        'priority' => 'integer',
    ];

    public function products()
    {
        return $this->hasMany(Product::class, 'product_badge_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
