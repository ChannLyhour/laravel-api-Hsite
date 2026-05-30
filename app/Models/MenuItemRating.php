<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuItemRating extends Model
{
    use HasFactory;

    protected $table = 'menu_item_ratings';

    protected $fillable = [
        'menu_item_id',
        'customer_id',
        'order_id',
        'rating',
        'comment',
        'created_by',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
