<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductAddon extends Model
{
    use HasFactory;

    // Use only created_at, disable updated_at
    const UPDATED_AT = null;

    protected $fillable = [
        'product_id',
        'addon_name',
        'additional_price',
        'discount',
        'discount_type',
        'image',
        'is_default',
    ];

    protected $casts = [
        'additional_price' => 'decimal:2',
        'discount' => 'decimal:2',
        'product_id' => 'integer',
        'is_default' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
