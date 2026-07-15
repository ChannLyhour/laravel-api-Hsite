<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariantStockBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_variant_id',
        'initial_qty',
        'remaining_qty',
        'purchase_price',
    ];

    protected $casts = [
        'initial_qty' => 'integer',
        'remaining_qty' => 'integer',
        'purchase_price' => 'decimal:4',
    ];

    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
