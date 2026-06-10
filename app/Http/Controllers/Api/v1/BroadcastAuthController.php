<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Participant;
use App\Models\Store;
use Illuminate\Http\Request;
use Pusher\Pusher;

class BroadcastAuthController extends Controller
{
    /**
     * Authorize a private Pusher channel using credentials from the stores table.
     *
     * POST /api/broadcasting/auth
     * Middleware: api, auth:sanctum
     */
    public function authenticate(Request $request)
    {
        $user        = $request->user();
        $channelName = $request->input('channel_name', '');
        $socketId    = $request->input('socket_id', '');

        // ── 1. Parse the conversation ID from the channel name ──────────────
        // Laravel Echo sends "private-chat.{id}" for echo.private('chat.{id}')
        if (!preg_match('/^private-chat\.(\d+)$/', $channelName, $matches)) {
            return response()->json(['message' => 'Invalid channel name.'], 403);
        }

        $conversationId = (int) $matches[1];

        // ── 2. Verify the authenticated user is a conversation participant ──
        $isParticipant = Participant::where('conversation_id', $conversationId)
            ->where('user_id', $user->id)
            ->exists();

        if (!$isParticipant) {
            return response()->json(['message' => 'Forbidden. You are not a participant in this conversation.'], 403);
        }

        // ── 3. Load Pusher credentials from the stores table ────────────────
        $conversation = Conversation::find($conversationId);
        $pusherCreds  = $this->resolvePusherCredentials($conversation);

        if (!$pusherCreds) {
            return response()->json(['message' => 'Pusher credentials not configured for this store.'], 500);
        }

        // ── 4. Create a fresh Pusher instance using DB credentials ──────────
        $pusher = new Pusher(
            $pusherCreds['key'],
            $pusherCreds['secret'],
            $pusherCreds['app_id'],
            [
                'cluster'  => $pusherCreds['cluster'],
                'useTLS'   => true,
                'curl_options' => [
                    CURLOPT_SSL_VERIFYPEER => false,
                    CURLOPT_SSL_VERIFYHOST => 0,
                ],
            ]
        );

        // ── 5. Generate and return the signed channel auth token ─────────────
        $authData = $pusher->authorizeChannel($channelName, $socketId);

        return response($authData)->header('Content-Type', 'application/json');
    }

    /**
     * Resolve Pusher credentials from the stores table for the given conversation.
     *
     * @param  \App\Models\Conversation|null  $conversation
     * @return array|null  ['app_id', 'key', 'secret', 'cluster'] or null if not found
     */
    private function resolvePusherCredentials(?Conversation $conversation): ?array
    {
        if (!$conversation) {
            return null;
        }

        $ownerId = null;

        // 1. Try resolving ownerId via store_id first
        if ($conversation->store_id) {
            $storeRow = Store::find($conversation->store_id);
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
            return null;
        }

        $settings = Store::where('created_by', $ownerId)
            ->whereIn('key', ['pusher_app_id', 'pusher_app_key', 'pusher_app_secret', 'pusher_app_cluster'])
            ->get()
            ->pluck('value', 'key');

        $appId   = $settings->get('pusher_app_id');
        $key     = $settings->get('pusher_app_key');
        $secret  = $settings->get('pusher_app_secret');
        $cluster = $settings->get('pusher_app_cluster');

        if (!$appId || !$key || !$secret || !$cluster) {
            return null;
        }

        return [
            'app_id' => $appId,
            'key' => $key,
            'secret' => $secret,
            'cluster' => $cluster
        ];
    }
}
