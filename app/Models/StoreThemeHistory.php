<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StoreThemeHistory extends Model
{
    use HasFactory;

    protected $table = 'store_theme_history';

    protected $fillable = [
        'owner_id',
        'theme_id',
        'changed_by',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
