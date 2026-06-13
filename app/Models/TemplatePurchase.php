<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemplatePurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'template_id',
        'order_ref',
        'amount_paid',
        'purchased_at',
    ];

    protected $casts = [
        'amount_paid' => 'decimal:2',
        'purchased_at' => 'datetime',
    ];

    /**
     * Relationship: User who purchased the template
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relationship: Template that was purchased
     */
    public function template()
    {
        return $this->belongsTo(Template::class);
    }
}
