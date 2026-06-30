<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StoreDomain extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'domain',
        'type',
        'is_verified',
        'is_primary',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'is_primary'  => 'boolean',
    ];

    /**
     * The store owner (user) this domain belongs to.
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Resolve a domain string to the store owner ID.
     * Returns the owner_id or null if not found.
     */
    public static function resolveOwner(string $domain): ?int
    {
        $record = static::where('domain', strtolower($domain))->first();
        return $record?->owner_id;
    }

    /**
     * Get all domains for a specific store owner.
     */
    public static function forOwner(int $ownerId)
    {
        return static::where('owner_id', $ownerId)->orderBy('is_primary', 'desc')->get();
    }
}
