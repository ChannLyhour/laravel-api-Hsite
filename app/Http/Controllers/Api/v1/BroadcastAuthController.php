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

        // ── 3. Configure Pusher dynamically using the Store model ──────────
        Store::configurePusherForConversation($conversationId);

        $appId   = config('broadcasting.connections.pusher.app_id');
        $key     = config('broadcasting.connections.pusher.key');
        $secret  = config('broadcasting.connections.pusher.secret');
        $cluster = config('broadcasting.connections.pusher.options.cluster');

        if (!$appId || !$key || !$secret || !$cluster) {
            return response()->json(['message' => 'Pusher credentials not configured.'], 500);
        }

        // ── 4. Create a fresh Pusher instance using DB credentials ──────────
        $pusher = new Pusher(
            $key,
            $secret,
            $appId,
            [
                'cluster'  => $cluster,
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
}
