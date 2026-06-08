<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'product_variant_id',
        'name',
        'quantity',
        'price',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'quantity' => 'integer',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function menuItem()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    protected $appends = ['menu_item_id', 'image'];

    public function getMenuItemIdAttribute()
    {
        return $this->product_variant_id;
    }

    public function getImageAttribute()
    {
        if ($this->relationLoaded('productVariant') && $this->productVariant) {
            if ($this->productVariant->relationLoaded('product') && $this->productVariant->product) {
                return $this->productVariant->product->display_image;
            }
        }
        return url('default.png');
    }
}
