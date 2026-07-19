<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RestockRequest extends Model
{
    use HasFactory;

    protected $table = 'restock_requests';

    protected $fillable = [
        'store_id',
        'product_id',
        'product_variant_id',
        'requested_by',
        'current_stock',
        'requested_qty',
        'status',
        'notes',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function store()
    {
        return $this->belongsTo(User::class, 'store_id');
    }
}
