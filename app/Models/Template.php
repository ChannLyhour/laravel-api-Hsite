<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'tpl_code',
        'title',
        'description',
        'price',
        'file_path',
        'theme_key',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    /**
     * Relationship: purchases of this template
     */
    public function purchases()
    {
        return $this->hasMany(TemplatePurchase::class);
    }

    /**
     * Relationship: download tokens generated for this template
     */
    public function downloadTokens()
    {
        return $this->hasMany(TemplateDownloadToken::class);
    }
}
