<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'cost',
        'estimated_days_min',
        'estimated_days_max',
        'is_active',
        'image',
        'created_by',
        'delivery_zone_id',
    ];

    protected $casts = [
        'cost' => 'decimal:2',
        'estimated_days_min' => 'integer',
        'estimated_days_max' => 'integer',
        'is_active' => 'boolean',
        'delivery_zone_id' => 'integer',
    ];

    /**
     * User who created this delivery method.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The delivery zone this method is restricted to.
     */
    public function deliveryZone()
    {
        return $this->belongsTo(DeliveryZone::class, 'delivery_zone_id');
    }
}
