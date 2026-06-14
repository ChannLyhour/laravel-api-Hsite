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
    ];

    protected $casts = [
        'additional_price' => 'decimal:2',
        'product_id' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
