<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $fillable = [
        'store_id',
        'title',
        'is_group',
        'created_by',
    ];

    protected $casts = [
        'is_group' => 'boolean',
    ];

    /**
     * Store this conversation belongs to (scopes it to a specific boutique).
     */
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Creator of the conversation.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Participants in the conversation.
     */
    public function participants()
    {
        return $this->hasMany(Participant::class);
    }

    /**
     * Users associated with the conversation.
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'participants')
            ->withPivot(['role', 'joined_at', 'last_read_message_id']);
    }

    /**
     * Messages in the conversation.
     */
    public function messages()
    {
        return $this->hasMany(Message::class);
    }
}
