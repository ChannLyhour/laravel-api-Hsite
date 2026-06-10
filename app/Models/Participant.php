<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Participant extends Model
{
    // Disable timestamps as we use custom joined_at
    public $timestamps = false;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'role',
        'joined_at',
        'last_read_message_id',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
    ];

    /**
     * Conversation this participant belongs to.
     */
    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * User details of the participant.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Last message read by this participant.
     */
    public function lastReadMessage()
    {
        return $this->belongsTo(Message::class, 'last_read_message_id');
    }
}
