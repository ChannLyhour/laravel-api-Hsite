<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StorePage extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'slug',
        'title',
        'content_json',
        'is_published',
    ];

    protected $casts = [
        'content_json' => 'array',
        'is_published' => 'boolean',
    ];

    /**
     * Get the store owner who owns this custom page.
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
