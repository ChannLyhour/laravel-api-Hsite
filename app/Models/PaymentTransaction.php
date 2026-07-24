<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'transaction_id',
        'payment_method',
        'amount',
        'status',
        'raw_response',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Check if the transaction has expired (Default 15 minutes timeout for KHQR).
     */
    public function isExpired(): bool
    {
        if ($this->status === 'expired') {
            return true;
        }

        if ($this->status === 'success') {
            return false;
        }

        $raw = json_decode($this->raw_response ?? '', true) ?: [];
        $expireTimeStr = $raw['expires_at'] ?? ($raw['data']['expires_at'] ?? null);

        if (!empty($expireTimeStr)) {
            return \Carbon\Carbon::parse($expireTimeStr)->isPast();
        }

        // Default 15 minutes expiry from creation
        return $this->created_at ? $this->created_at->addMinutes(15)->isPast() : false;
    }

    /**
     * Get Expiration DateTime carbon instance.
     */
    public function getExpirationTime()
    {
        $raw = json_decode($this->raw_response ?? '', true) ?: [];
        $expireTimeStr = $raw['expires_at'] ?? ($raw['data']['expires_at'] ?? null);

        if (!empty($expireTimeStr)) {
            return \Carbon\Carbon::parse($expireTimeStr);
        }

        return $this->created_at ? $this->created_at->addMinutes(15) : now()->addMinutes(15);
    }
}
