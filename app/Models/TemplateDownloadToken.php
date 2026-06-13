<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemplateDownloadToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'template_id',
        'token',
        'expires_at',
        'used_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    /**
     * Relationship: User who requested the token
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relationship: Template the token unlocks
     */
    public function template()
    {
        return $this->belongsTo(Template::class);
    }
}
