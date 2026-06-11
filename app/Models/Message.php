<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'sender_id',
        'message_type',
        'body',
        'media_url',
        'is_pinned',
        'reply_to_message_id',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
    ];

    /**
     * Conversation this message belongs to.
     */
    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Sender of this message.
     */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * The parent message being replied to.
     */
    public function replyTo()
    {
        return $this->belongsTo(Message::class, 'reply_to_message_id');
    }

    /**
     * Reactions associated with this message.
     */
    public function reactions()
    {
        return $this->hasMany(MessageReaction::class);
    }
}
