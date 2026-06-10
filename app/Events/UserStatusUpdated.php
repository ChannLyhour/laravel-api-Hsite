<?php

namespace App\Events;

use App\Models\User;
use App\Models\Participant;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class UserStatusUpdated implements ShouldBroadcastNow
{
    use SerializesModels;

    public int $userId;
    public bool $isOnline;
    public ?string $lastSeenAt;
    public int $conversationId;

    public function __construct(User $user, int $conversationId)
    {
        $this->userId         = $user->id;
        $this->isOnline       = (bool) $user->is_online;
        $this->lastSeenAt     = $user->last_seen_at
            ? $user->last_seen_at->toIso8601String()
            : null;
        $this->conversationId = $conversationId;

        // Dynamically configure Pusher for this conversation
        \App\Models\Store::configurePusherForConversation($conversationId);
    }

    /**
     * Broadcast on the private chat channel for this conversation.
     *
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        $appId   = config('broadcasting.connections.pusher.app_id');
        $key     = config('broadcasting.connections.pusher.key');
        $secret  = config('broadcasting.connections.pusher.secret');
        $cluster = config('broadcasting.connections.pusher.options.cluster');

        if (!$appId || !$key || !$secret || !$cluster) {
            \Illuminate\Support\Facades\Log::warning("Pusher is not configured for conversation {$this->conversationId}. Skipping status broadcast.");
            return [];
        }

        return [
            new PrivateChannel('chat.' . $this->conversationId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'UserStatusUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'user_id'      => $this->userId,
            'is_online'    => $this->isOnline,
            'last_seen_at' => $this->lastSeenAt,
        ];
    }

    /**
     * Helper to broadcast status updates to all conversations the user is in.
     */
    public static function broadcastForUser(User $user): void
    {
        $conversationIds = Participant::where('user_id', $user->id)
            ->pluck('conversation_id')
            ->map(fn ($id) => (int) $id)
            ->toArray();

        foreach ($conversationIds as $convoId) {
            try {
                broadcast(new self($user, $convoId));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Failed to broadcast UserStatusUpdated for user {$user->id} on conversation {$convoId}: " . $e->getMessage());
            }
        }
    }
}
