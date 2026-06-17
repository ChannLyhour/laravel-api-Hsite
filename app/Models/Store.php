<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Store extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'key',
        'value',
        'guest_checkout',
    ];

    protected $casts = [
        'value' => 'string',
        'guest_checkout' => 'boolean',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    private static $originalPusherConfig = null;
    private static $originalDefaultBroadcaster = null;

    /**
     * Dynamically configure the Pusher connection credentials for a given conversation.
     */
    public static function configurePusherForConversation($conversationId)
    {
        // Capture original configuration at the very first call to keep it as default
        if (self::$originalPusherConfig === null) {
            self::$originalPusherConfig = config('broadcasting.connections.pusher');
            self::$originalDefaultBroadcaster = config('broadcasting.default');
        } else {
            // Restore original configuration before proceeding
            config([
                'broadcasting.connections.pusher' => self::$originalPusherConfig,
                'broadcasting.default'            => self::$originalDefaultBroadcaster,
            ]);
        }

        try {
            /** @var \Illuminate\Broadcasting\BroadcastManager $manager */
            $manager = app(\Illuminate\Contracts\Broadcasting\Factory::class);
            $manager->purge('pusher');
        } catch (\Throwable $e) {
            // Silently ignore
        }

        $conversation = \App\Models\Conversation::find($conversationId);
        if (!$conversation) {
            return;
        }

        $ownerId = null;

        // 1. Try resolving ownerId via store_id first
        if ($conversation->store_id) {
            $storeRow = self::find($conversation->store_id);
            if ($storeRow) {
                $ownerId = $storeRow->created_by;
            }
        }

        // 2. If store_id is null/invalid, look up the participants to find the owner/admin
        if (!$ownerId) {
            $owner = $conversation->participants()
                ->join('users', 'participants.user_id', '=', 'users.id')
                ->whereIn('users.role_id', [1, 30003])
                ->first();
            if ($owner) {
                $ownerId = $owner->user_id;
            }
        }

        // 3. Fallback: if still not resolved, just use the first participant that is not the creator
        if (!$ownerId) {
            $otherParticipant = $conversation->participants()
                ->where('user_id', '!=', $conversation->created_by)
                ->first();
            if ($otherParticipant) {
                $ownerId = $otherParticipant->user_id;
            }
        }

        if (!$ownerId) {
            return;
        }

        $settings = self::where('created_by', $ownerId)->get()->pluck('value', 'key');

        $appId = $settings->get('pusher_app_id');
        $key = $settings->get('pusher_app_key');
        $secret = $settings->get('pusher_app_secret');
        $cluster = $settings->get('pusher_app_cluster');

        if ($appId && $key && $secret && $cluster) {
            config([
                'broadcasting.default'                           => 'pusher',
                'broadcasting.connections.pusher.app_id'         => $appId,
                'broadcasting.connections.pusher.key'            => $key,
                'broadcasting.connections.pusher.secret'         => $secret,
                'broadcasting.connections.pusher.options.cluster' => $cluster,
                'broadcasting.connections.pusher.options.host'   => 'api-' . $cluster . '.pusher.com',
                'broadcasting.connections.pusher.client_options' => [
                    'verify' => false,
                ],
            ]);

            // Force the BroadcastManager to drop its cached Pusher driver
            // so the next call re-instantiates Pusher with the updated config.
            try {
                /** @var \Illuminate\Broadcasting\BroadcastManager $manager */
                $manager = app(\Illuminate\Contracts\Broadcasting\Factory::class);
                $manager->purge('pusher');
            } catch (\Throwable $e) {
                // Silently ignore – if the manager wasn't booted yet, no cache to clear
            }
        }
    }
}
