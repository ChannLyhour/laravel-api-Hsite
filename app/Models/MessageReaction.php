<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageReaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'message_id',
        'user_id',
        'emoji',
    ];

    /**
     * The message this reaction belongs to.
     */
    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * The user who made the reaction.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
