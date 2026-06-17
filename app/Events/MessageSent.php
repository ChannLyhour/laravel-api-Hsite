<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use SerializesModels;

    /**
     * The message instance.
     *
     * @var \App\Models\Message
     */
    public $message;

    /**
     * Create a new event instance.
     */
    public function __construct(Message $message)
    {
        $this->message = $message;
        \App\Models\Store::configurePusherForConversation($message->conversation_id);
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
            \Illuminate\Support\Facades\Log::warning("Pusher is not configured for conversation {$this->message->conversation_id}. Skipping message broadcast.");
            return [];
        }

        return [
            new PrivateChannel('chat.'.$this->message->conversation_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'MessageSent';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'message' => [
                'id' => $this->message->id,
                'conversation_id' => $this->message->conversation_id,
                'sender_id' => $this->message->sender_id,
                'message_type' => $this->message->message_type,
                'body' => $this->message->body,
                'media_url' => $this->message->media_url ? (str_starts_with($this->message->media_url, 'data:') ? url('/api/chat/messages/' . $this->message->id . '/media') : (str_starts_with($this->message->media_url, 'http') ? $this->message->media_url : asset($this->message->media_url))) : null,
                'is_pinned' => (bool)$this->message->is_pinned,
                'reply_to_message_id' => $this->message->reply_to_message_id,
                'reply_to_message' => $this->message->replyTo ? [
                    'id' => $this->message->replyTo->id,
                    'body' => $this->message->replyTo->body,
                    'message_type' => $this->message->replyTo->message_type,
                    'media_url' => $this->message->replyTo->media_url ? (str_starts_with($this->message->replyTo->media_url, 'data:') ? url('/api/chat/messages/' . $this->message->replyTo->id . '/media') : (str_starts_with($this->message->replyTo->media_url, 'http') ? $this->message->replyTo->media_url : asset($this->message->replyTo->media_url))) : null,
                    'sender' => $this->message->replyTo->sender ? [
                        'id' => $this->message->replyTo->sender->id,
                        'name' => $this->message->replyTo->sender->name,
                    ] : null,
                ] : null,
                'reactions' => [],
                'created_at' => $this->message->created_at->toIso8601String(),
            ]
        ];
    }
}
