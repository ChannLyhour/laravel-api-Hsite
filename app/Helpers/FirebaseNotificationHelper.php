<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;
use Kreait\Laravel\Firebase\Facades\Firebase;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use App\Models\Store;

class FirebaseNotificationHelper
{
    /**
     * Send FCM Push Notification to a target device token.
     *
     * @param string $deviceToken
     * @param string $title
     * @param string $body
     * @param array $data
     * @return bool
     */
    public static function sendToToken(string $deviceToken, string $title, string $body, array $data = []): bool
    {
        if (empty($deviceToken)) {
            Log::warning("FirebaseNotificationHelper: Device token is empty.");
            return false;
        }

        try {
            $messaging = Firebase::messaging();

            $notification = Notification::create($title, $body);
            $message = CloudMessage::withTarget('token', $deviceToken)
                ->withNotification($notification)
                ->withData($data);

            $messaging->send($message);
            Log::info("🔥 [FCM SENT] Push sent to token {$deviceToken} | Title: {$title}");
            return true;
        } catch (\Throwable $e) {
            Log::error("❌ [FCM FAILED] Push to token failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send FCM Push Notification to a topic (e.g. 'all_customers', 'store_6').
     *
     * @param string $topic
     * @param string $title
     * @param string $body
     * @param array $data
     * @return bool
     */
    public static function sendToTopic(string $topic, string $title, string $body, array $data = []): bool
    {
        if (empty($topic)) {
            Log::warning("FirebaseNotificationHelper: Topic name is empty.");
            return false;
        }

        try {
            $messaging = Firebase::messaging();

            $notification = Notification::create($title, $body);
            $message = CloudMessage::withTarget('topic', ltrim($topic, '/'))
                ->withNotification($notification)
                ->withData($data);

            $messaging->send($message);
            Log::info("🔥 [FCM TOPIC SENT] Push sent to topic '{$topic}' | Title: {$title}");
            return true;
        } catch (\Throwable $e) {
            Log::error("❌ [FCM TOPIC FAILED] Push to topic '{$topic}' failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if a store has valid Firebase configuration saved.
     *
     * @param int|string $storeId
     * @return bool
     */
    public static function isConfiguredForStore($storeId): bool
    {
        $isOwnerUser = Store::where('created_by', $storeId)->exists();
        $ownerUserId = $isOwnerUser ? $storeId : (Store::where('id', $storeId)->value('value') ?: $storeId);

        $apiKey = Store::where('created_by', $ownerUserId)->where('key', 'firebase_api_key')->value('value');
        $projectId = Store::where('created_by', $ownerUserId)->where('key', 'firebase_project_id')->value('value');

        return !empty($apiKey) && !empty($projectId);
    }
}
