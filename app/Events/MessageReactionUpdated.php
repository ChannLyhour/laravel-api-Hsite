<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class MessageReactionUpdated implements ShouldBroadcastNow
{
    use SerializesModels;

    public int $messageId;
    public int $conversationId;
    public array $reactions;

    public function __construct(int $messageId, int $conversationId, array $reactions)
    {
        $this->messageId = $messageId;
        $this->conversationId = $conversationId;
        $this->reactions = $reactions;

        // Dynamically configure Pusher for this conversation
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

        if (!$appId || !$key || !$secret || !$cluster) {
            \Illuminate\Support\Facades\Log::warning("Pusher is not configured for conversation {$this->conversationId}. Skipping reaction broadcast.");
            return [];
        }

        return [
            new PrivateChannel('chat.' . $this->conversationId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'MessageReactionUpdated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'message_id'      => $this->messageId,
            'conversation_id' => $this->conversationId,
            'reactions'       => $this->reactions,
        ];
    }
}
