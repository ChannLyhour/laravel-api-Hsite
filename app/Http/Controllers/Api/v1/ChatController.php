<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Participant;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Helpers\UploadHelper;
use App\Events\MessageSent;
use App\Models\MessageReaction;
use App\Events\MessageReactionUpdated;

class ChatController extends Controller
{
    /**
     * Get all conversations for the authenticated user.
     * GET /api/chat/conversations
     */
    public function getConversations(Request $request)
    {
        $user = $request->user();

        // Get conversations where user is a participant
        $conversations = Conversation::whereHas('participants', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with(['participants.user', 'messages'])
        ->get();

        $formatted = [];
        foreach ($conversations as $conversation) {
            // Find the other participant details
            $otherParticipant = null;
            foreach ($conversation->participants as $participant) {
                if ($participant->user_id !== $user->id) {
                    $otherParticipant = $participant->user;
                    break;
                }
            }

            // Fallback to self if no other participant
            if (!$otherParticipant) {
                $otherParticipant = $user;
            }

            // Get last message
            $lastMsg = $conversation->messages()->latest()->first();

            // Find current user's participant entry to check read status
            $currentParticipant = $conversation->participants->where('user_id', $user->id)->first();
            $lastReadId = $currentParticipant ? $currentParticipant->last_read_message_id : null;

            // Count unread messages
            $unreadQuery = Message::where('conversation_id', $conversation->id);
            if ($lastReadId) {
                $unreadQuery->where('id', '>', $lastReadId);
            }
            $unreadCount = $unreadQuery->count();

            // Retrieve Pusher configuration from store settings table
            $pusherKey = null;
            $pusherCluster = null;
            $ownerIdForConfig = null;
            if ($conversation->store_id) {
                $storeRow = Store::find($conversation->store_id);
                if ($storeRow) {
                    $ownerIdForConfig = $storeRow->created_by;
                }
            }
            if (!$ownerIdForConfig) {
                $ownerParticipant = $conversation->participants->first(function ($p) {
                    return in_array((int)($p->user->role_id ?? 0), [1, 30003]);
                });
                if ($ownerParticipant) {
                    $ownerIdForConfig = $ownerParticipant->user_id;
                } else {
                    $ownerIdForConfig = $otherParticipant->id;
                }
            }
            if ($ownerIdForConfig) {
                $pusherKey = Store::where('created_by', $ownerIdForConfig)->where('key', 'pusher_app_key')->value('value');
                $pusherCluster = Store::where('created_by', $ownerIdForConfig)->where('key', 'pusher_app_cluster')->value('value');
            }

            $formatted[] = [
                'id' => $conversation->id,
                'store_id' => $conversation->store_id,
                'is_group' => $conversation->is_group,
                'title' => $conversation->title,
                'created_at' => $conversation->created_at->toIso8601String(),
                'updated_at' => $conversation->updated_at->toIso8601String(),
                'other_user' => [
                    'id' => $otherParticipant->id,
                    'name' => $otherParticipant->name,
                    'first_name' => $otherParticipant->first_name,
                    'last_name' => $otherParticipant->last_name,
                    'image' => $otherParticipant->image, // Accessor returns full URL
                    'is_online' => $otherParticipant->is_online,
                    'last_seen_at' => $otherParticipant->last_seen_at ? $otherParticipant->last_seen_at->toIso8601String() : null,
                ],
                'last_message' => $lastMsg ? [
                    'id' => $lastMsg->id,
                    'body' => $lastMsg->body,
                    'message_type' => $lastMsg->message_type,
                    'media_url' => $lastMsg->media_url,
                    'is_pinned' => (bool)$lastMsg->is_pinned,
                    'sender_id' => $lastMsg->sender_id,
                    'created_at' => $lastMsg->created_at->toIso8601String(),
                ] : null,
                'unread_count' => $unreadCount,
                'pusher_key' => $pusherKey ?: env('PUSHER_APP_KEY'),
                'pusher_cluster' => $pusherCluster ?: env('PUSHER_APP_CLUSTER'),
            ];
        }

        // Sort conversations by updated_at descending (newest activity first)
        usort($formatted, function ($a, $b) {
            return strcmp($b['updated_at'], $a['updated_at']);
        });

        return response()->json($formatted);
    }

    /**
     * Start or fetch a conversation with a store owner.
     * POST /api/chat/conversations
     */
    public function startConversation(Request $request)
    {
        $request->validate([
            'store_id' => 'required',
        ]);

        $storeId = $request->input('store_id');
        $ownerId = null;
        $resolvedStoreSetting = null;

        // Check if store_id points to an owner user ID directly
        $ownerExists = User::where('id', $storeId)->whereIn('role_id', [1, 30003])->exists();
        if ($ownerExists) {
            $ownerId = intval($storeId);
            $resolvedStoreSetting = Store::where('created_by', $ownerId)->first();
        } else {
            // Otherwise try resolving as store settings row ID
            $storeRow = Store::find($storeId);
            if ($storeRow) {
                $ownerId = $storeRow->created_by;
                $resolvedStoreSetting = $storeRow;
            }
        }

        if (!$ownerId) {
            return response()->json(['detail' => 'Store owner not found for the given store_id.'], 404);
        }

        $user = $request->user();

        // Prevent creating duplicate conversations for same 1-on-1 pair
        $conversation = Conversation::where('is_group', false)
            ->whereHas('participants', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->whereHas('participants', function ($query) use ($ownerId) {
                $query->where('user_id', $ownerId);
            })
            ->first();

        if (!$conversation) {
            $conversation = Conversation::create([
                'store_id' => $resolvedStoreSetting ? $resolvedStoreSetting->id : null,
                'is_group' => false,
                'created_by' => $user->id,
            ]);

            // Add Customer Participant
            Participant::create([
                'conversation_id' => $conversation->id,
                'user_id' => $user->id,
                'role' => 'member',
                'joined_at' => now(),
            ]);

            // Add Owner Participant
            Participant::create([
                'conversation_id' => $conversation->id,
                'user_id' => $ownerId,
                'role' => 'member',
                'joined_at' => now(),
            ]);
        }

        $pusherKey = Store::where('created_by', $ownerId)->where('key', 'pusher_app_key')->value('value');
        $pusherCluster = Store::where('created_by', $ownerId)->where('key', 'pusher_app_cluster')->value('value');

        return response()->json([
            'id' => $conversation->id,
            'store_id' => $conversation->store_id,
            'is_group' => $conversation->is_group,
            'created_by' => $conversation->created_by,
            'created_at' => $conversation->created_at->toIso8601String(),
            'pusher_key' => $pusherKey ?: env('PUSHER_APP_KEY'),
            'pusher_cluster' => $pusherCluster ?: env('PUSHER_APP_CLUSTER'),
        ]);
    }

    /**
     * Get messages for a specific conversation.
     * GET /api/chat/conversations/{id}/messages
     */
    public function getMessages(Request $request, $id)
    {
        $user = $request->user();

        // Check if user is a participant
        $participant = Participant::where('conversation_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$participant) {
            return response()->json(['detail' => 'Access denied. You are not a participant in this conversation.'], 403);
        }

        // Get messages with cursor pagination and eager load replyTo/reactions
        $query = Message::with(['replyTo.sender', 'reactions.user'])->where('conversation_id', $id);

        if ($request->has('before_id')) {
            $query->where('id', '<', $request->input('before_id'));
        }

        $limit = $request->input('limit') ? intval($request->input('limit')) : 15;

        $messages = $query->orderBy('id', 'desc')
            ->limit($limit)
            ->get()
            ->reverse()
            ->values();

        // Mark messages as read for this participant (only when loading latest messages)
        if (!$request->has('before_id') && $messages->isNotEmpty()) {
            $latestMessageId = $messages->last()->id;
            Participant::where('conversation_id', $id)
                ->where('user_id', $user->id)
                ->update(['last_read_message_id' => $latestMessageId]);
        }

        $formatted = [];
        foreach ($messages as $msg) {
            $formatted[] = [
                'id' => $msg->id,
                'conversation_id' => $msg->conversation_id,
                'sender_id' => $msg->sender_id,
                'message_type' => $msg->message_type,
                'body' => $msg->body,
                'media_url' => $msg->media_url ? (str_starts_with($msg->media_url, 'http') ? $msg->media_url : asset($msg->media_url)) : null,
                'is_pinned' => (bool)$msg->is_pinned,
                'reply_to_message_id' => $msg->reply_to_message_id,
                'reply_to_message' => $msg->replyTo ? [
                    'id' => $msg->replyTo->id,
                    'body' => $msg->replyTo->body,
                    'message_type' => $msg->replyTo->message_type,
                    'media_url' => $msg->replyTo->media_url ? (str_starts_with($msg->replyTo->media_url, 'http') ? $msg->replyTo->media_url : asset($msg->replyTo->media_url)) : null,
                    'sender' => $msg->replyTo->sender ? [
                        'id' => $msg->replyTo->sender->id,
                        'name' => $msg->replyTo->sender->name,
                    ] : null,
                ] : null,
                'reactions' => $msg->reactions->map(fn($r) => [
                    'id' => $r->id,
                    'message_id' => $r->message_id,
                    'user_id' => $r->user_id,
                    'emoji' => $r->emoji,
                    'user' => $r->user ? [
                        'id' => $r->user->id,
                        'name' => $r->user->name,
                    ] : null,
                ])->toArray(),
                'created_at' => $msg->created_at->toIso8601String(),
            ];
        }

        return response()->json($formatted);
    }

    /**
     * Send a message to a conversation.
     * POST /api/chat/conversations/{id}/messages
     */
    public function sendMessage(Request $request, $id)
    {
        $user = $request->user();

        // Check if user is participant
        $participant = Participant::where('conversation_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$participant) {
            return response()->json(['detail' => 'Access denied. You are not a participant in this conversation.'], 403);
        }

        $request->validate([
            'message_type' => 'nullable|string|in:text,image,audio',
            'body' => 'nullable|string',
            'media_url' => 'nullable|string',
            'reply_to_message_id' => 'nullable|integer|exists:messages,id',
        ]);

        if (empty($request->body) && empty($request->media_url)) {
            return response()->json(['detail' => 'Message body or media_url is required'], 422);
        }

        $message = Message::create([
            'conversation_id' => $id,
            'sender_id' => $user->id,
            'message_type' => $request->input('message_type', 'text'),
            'body' => $request->body,
            'media_url' => $request->media_url,
            'reply_to_message_id' => $request->reply_to_message_id,
        ]);

        // Load relationships before broadcasting
        $message->load(['replyTo.sender']);

        // Broadcast event in real-time
        broadcast(new MessageSent($message))->toOthers();

        // Touch conversation updated_at
        $conversation = Conversation::find($id);
        $conversation->touch();

        // Mark as read for the sender
        Participant::where('conversation_id', $id)
            ->where('user_id', $user->id)
            ->update(['last_read_message_id' => $message->id]);

        return response()->json([
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'sender_id' => $message->sender_id,
            'message_type' => $message->message_type,
            'body' => $message->body,
            'media_url' => $message->media_url ? (str_starts_with($message->media_url, 'http') ? $message->media_url : asset($message->media_url)) : null,
            'is_pinned' => (bool)$message->is_pinned,
            'reply_to_message_id' => $message->reply_to_message_id,
            'reply_to_message' => $message->replyTo ? [
                'id' => $message->replyTo->id,
                'body' => $message->replyTo->body,
                'message_type' => $message->replyTo->message_type,
                'media_url' => $message->replyTo->media_url ? (str_starts_with($message->replyTo->media_url, 'http') ? $message->replyTo->media_url : asset($message->replyTo->media_url)) : null,
                'sender' => $message->replyTo->sender ? [
                    'id' => $message->replyTo->sender->id,
                    'name' => $message->replyTo->sender->name,
                ] : null,
            ] : null,
            'reactions' => [],
            'created_at' => $message->created_at->toIso8601String(),
        ], 201);
    }

    /**
     * Upload chat media attachment.
     * POST /api/chat/upload
     */
    public function uploadMedia(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpeg,png,jpg,gif,svg,webp,mp3,wav,ogg,webm,m4a,aac,flac|max:10240',
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $mimeType = $file->getMimeType();

            // If it's an audio file (or webm/ogg audio), upload it directly without Intervention Image
            $ext = strtolower($file->getClientOriginalExtension());
            $isAudio = str_starts_with($mimeType, 'audio/') || in_array($ext, ['mp3', 'wav', 'ogg', 'webm', 'm4a', 'aac', 'flac']);

            if ($isAudio) {
                $destinationPath = public_path('uploads/chats');
                if (!\Illuminate\Support\Facades\File::isDirectory($destinationPath)) {
                    \Illuminate\Support\Facades\File::makeDirectory($destinationPath, 0755, true, true);
                }

                if (empty($ext)) {
                    $ext = str_contains($mimeType, 'webm') ? 'webm' : 'wav';
                }
                $filename = date('dmy_His') . '_' . \Illuminate\Support\Str::random(10) . '.' . $ext;
                $file->move($destinationPath, $filename);
                $path = 'uploads/chats/' . $filename;
            } else {
                $path = UploadHelper::uploadImage($file, 'chats');
            }

            return response()->json([
                'url' => asset($path),
                'path' => $path
            ]);
        }

        return response()->json(['detail' => 'No file provided.'], 400);
    }

    /**
     * Delete a message.
     * DELETE /api/chat/messages/{id}
     */
    public function deleteMessage(Request $request, $id)
    {
        $user = $request->user();
        $message = Message::find($id);

        if (!$message) {
            return response()->json(['detail' => 'Message not found.'], 404);
        }

        // Verify participant
        $isParticipant = Participant::where('conversation_id', $message->conversation_id)
            ->where('user_id', $user->id)
            ->exists();

        if (!$isParticipant) {
            return response()->json(['detail' => 'Access denied.'], 403);
        }

        $messageId = $message->id;
        $conversationId = $message->conversation_id;

        $message->delete();

        broadcast(new \App\Events\MessageDeleted($messageId, $conversationId))->toOthers();

        return response()->json(['message' => 'Message deleted successfully.']);
    }

    /**
     * Pin/unpin a message.
     * POST /api/chat/messages/{id}/pin
     */
    public function togglePinMessage(Request $request, $id)
    {
        $user = $request->user();
        $message = Message::find($id);

        if (!$message) {
            return response()->json(['detail' => 'Message not found.'], 404);
        }

        // Verify participant
        $isParticipant = Participant::where('conversation_id', $message->conversation_id)
            ->where('user_id', $user->id)
            ->exists();

        if (!$isParticipant) {
            return response()->json(['detail' => 'Access denied.'], 403);
        }

        $message->is_pinned = !$message->is_pinned;
        $message->save();

        return response()->json([
            'id' => $message->id,
            'is_pinned' => (bool)$message->is_pinned,
            'message' => $message->is_pinned ? 'Message pinned.' : 'Message unpinned.'
        ]);
    }

    /**
     * Add/remove/toggle emoji reaction on a message.
     * POST /api/chat/messages/{id}/react
     */
    public function toggleReaction(Request $request, $messageId)
    {
        $user = $request->user();
        
        $message = Message::find($messageId);
        if (!$message) {
            return response()->json(['detail' => 'Message not found'], 404);
        }

        // Check if user is participant in this conversation
        $participant = Participant::where('conversation_id', $message->conversation_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$participant) {
            return response()->json(['detail' => 'Access denied. You are not a participant in this conversation.'], 403);
        }

        $request->validate([
            'emoji' => 'required|string|max:50',
        ]);

        $emoji = $request->emoji;

        // Check if the reaction already exists for this user on this message
        $existing = MessageReaction::where('message_id', $messageId)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            if ($existing->emoji === $emoji) {
                // Same emoji clicked: toggle off (remove reaction)
                $existing->delete();
            } else {
                // Different emoji clicked: update to the new emoji
                $existing->update(['emoji' => $emoji]);
            }
        } else {
            // No reaction yet: create new reaction
            MessageReaction::create([
                'message_id' => $messageId,
                'user_id'    => $user->id,
                'emoji'      => $emoji,
            ]);
        }

        // Fetch all current reactions for this message to broadcast and return
        $reactions = MessageReaction::with('user')
            ->where('message_id', $messageId)
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'message_id' => $r->message_id,
                'user_id' => $r->user_id,
                'emoji' => $r->emoji,
                'user' => $r->user ? [
                    'id' => $r->user->id,
                    'name' => $r->user->name,
                ] : null,
            ])
            ->toArray();

        // Broadcast reaction update
        broadcast(new MessageReactionUpdated($messageId, $message->conversation_id, $reactions))->toOthers();

        return response()->json([
            'success' => true,
            'message_id' => intval($messageId),
            'reactions' => $reactions,
        ]);
    }

    /**
     * Lightweight DB poll — returns online status for one or more users.
     * GET /api/chat/user-status?user_ids[]=4&user_ids[]=7
     */
    public function getUserStatus(Request $request)
    {
        $ids = $request->query('user_ids', []);
        if (empty($ids)) {
            return response()->json([]);
        }

        $users = User::whereIn('id', array_map('intval', (array) $ids))
            ->select(['id', 'is_online', 'last_seen_at'])
            ->get()
            ->map(fn ($u) => [
                'user_id'      => $u->id,
                'is_online'    => (bool) $u->is_online,
                'last_seen_at' => $u->last_seen_at ? $u->last_seen_at->toIso8601String() : null,
            ]);

        return response()->json($users);
    }
}
