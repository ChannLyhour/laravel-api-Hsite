<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'body',
        'featured_image',
        'status',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
