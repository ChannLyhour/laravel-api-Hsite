<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryZone extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'type',
        'center_lat',
        'center_lng',
        'radius_km',
        'polygon_coordinates',
        'delivery_fee',
        'estimated_delivery_time',
        'is_active',
        'created_by',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Delivery methods linked to this zone.
     */
    public function deliveryMethods()
    {
        return $this->hasMany(DeliveryMethod::class, 'delivery_zone_id');
    }
}
