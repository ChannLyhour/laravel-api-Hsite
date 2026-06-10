<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('chat.{conversationId}', function ($user, $conversationId) {
    return \App\Models\Participant::where('conversation_id', $conversationId)
        ->where('user_id', $user->id)
        ->exists();
});
