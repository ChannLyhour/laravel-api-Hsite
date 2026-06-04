<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'variant_sku',
        'variant_name',
        'region_code',
        'currency_code',
        'purchase_price',
        'retail_price',
        'compare_at_price',
        'stock_qty',
        'low_stock_threshold',
        'created_by',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:4',
        'retail_price' => 'decimal:4',
        'compare_at_price' => 'decimal:4',
        'stock_qty' => 'integer',
        'low_stock_threshold' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attributeValues()
    {
        return $this->belongsToMany(ProductAttributeValue::class, 'product_variant_attribute_values', 'product_variant_id', 'product_attribute_value_id');
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }
}
