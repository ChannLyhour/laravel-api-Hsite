<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class MessageDeleted implements ShouldBroadcastNow
{
    use SerializesModels;

    public $messageId;
    public $conversationId;

    /**
     * Create a new event instance.
     */
    public function __construct($messageId, $conversationId)
    {
        $this->messageId = $messageId;
        $this->conversationId = $conversationId;
        \Illuminate\Support\Facades\Log::info("MessageDeleted construct: messageId={$messageId}, conversationId={$conversationId}");
        \App\Models\Store::configurePusherForConversation($conversationId);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $appId   = config('broadcasting.connections.pusher.app_id');
        $key     = config('broadcasting.connections.pusher.key');
        $secret  = config('broadcasting.connections.pusher.secret');
        $cluster = config('broadcasting.connections.pusher.options.cluster');

        \Illuminate\Support\Facades\Log::info("MessageDeleted broadcastOn: appId={$appId}, key={$key}, cluster={$cluster}");

        if (!$appId || !$key || !$secret || !$cluster) {
            \Illuminate\Support\Facades\Log::warning("Pusher is not configured for conversation {$this->conversationId}. Skipping message deletion broadcast.");
            return [];
        }

        return [
            new PrivateChannel('chat.'.$this->conversationId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'MessageDeleted';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'message_id' => intval($this->messageId),
            'conversation_id' => intval($this->conversationId),
        ];
    }
}
