<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Share extends Model
{
    use HasFactory;

    // The primary key associated with the table.
    protected $primaryKey = 'id';

    // Indicates if the IDs are auto-incrementing.
    public $incrementing = false;

    // The "type" of the primary key.
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
    ];
}
