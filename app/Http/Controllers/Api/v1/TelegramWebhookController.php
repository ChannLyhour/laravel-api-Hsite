<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends Controller
{
    /**
     * Handle incoming Telegram webhook updates (Callback Queries).
     */
    public function handle(Request $request)
    {
        $update = $request->all();
        $token = $request->query('token') ?? $request->token;

        // Check if update is a callback query (button click)
        if (isset($update['callback_query'])) {
            return $this->handleCallbackQuery($update['callback_query'], $token);
        }

        // Check if update is a message (includes commands and contact sharing)
        if (isset($update['message'])) {
            return $this->handleMessage($update['message'], $token);
        }

        return response()->json(['status' => 'ignored']);
    }

    /**
     * Process inline keyboard button click callback.
     */
    private function handleCallbackQuery(array $callbackQuery, $tokenFromUrl = null)
    {
        $callbackId = $callbackQuery['id'];
        $data = $callbackQuery['data'] ?? ''; // e.g. "confirm_90151" or "cancel_90151"
        $chatId = $callbackQuery['message']['chat']['id'] ?? null;
        $messageId = $callbackQuery['message']['message_id'] ?? null;
        $originalText = $callbackQuery['message']['text'] ?? '';

        Log::info("Telegram webhook button clicked: data={$data}, chat={$chatId}");

        // Parse action and order ID
        $parts = explode('_', $data);
        if (count($parts) < 2) {
            return response()->json(['status' => 'invalid_data']);
        }

        $action = $parts[0]; // "confirm" or "cancel"
        $orderId = $parts[1];

        // Find the order
        $order = Order::with('items')->find($orderId);

        // Resolve token
        $botToken = $tokenFromUrl;
        if (!$botToken && $order) {
            $botToken = Store::where('created_by', $order->store_id)
                ->where('key', 'telegram_bot_token')
                ->value('value');
        }

        if (!$botToken) {
            return response()->json(['status' => 'token_not_found']);
        }

        if (!$order) {
            $this->answerCallbackQuery($botToken, $callbackId, "❌ Order not found.", true);
            return response()->json(['status' => 'order_not_found']);
        }

        // Handle Status Update
        if ($action === 'confirm') {
            if ($order->status === 'confirm' || $order->status === 'confirmed') {
                $this->answerCallbackQuery($botToken, $callbackId, "ℹ️ Order is already confirmed.");
                return response()->json(['status' => 'already_confirmed']);
            }

            $order->update(['status' => 'confirmed']); // Standard backend confirm status
            $statusAlert = "✅ Order #{$order->order_no} Confirmed!";
            $badge = "🟢 <b>Status: Confirmed by Owner</b>";
        } elseif ($action === 'cancel') {
            if ($order->status === 'canceled' || $order->status === 'cancelled') {
                $this->answerCallbackQuery($botToken, $callbackId, "ℹ️ Order is already canceled.");
                return response()->json(['status' => 'already_canceled']);
            }

            $order->update(['status' => 'cancelled']); // Standard backend cancel status
            $statusAlert = "❌ Order #{$order->order_no} Canceled.";
            $badge = "🔴 <b>Status: Canceled by Owner</b>";
        } else {
            return response()->json(['status' => 'unknown_action']);
        }

        // 1. Answer Telegram's callback to show alert/banner at the top of the app
        $this->answerCallbackQuery($botToken, $callbackId, $statusAlert);

        // 2. Edit the Telegram message to append status and remove buttons
        if ($chatId && $messageId) {
            $newText = \App\Helpers\TelegramHelper::formatOrderMessage($order, $badge);
            $this->editMessageText($botToken, $chatId, $messageId, $newText);
        }

        // Trigger data update event for any active dashboard browsers
        try {
            // Optional: Dispatch Pusher notification or event to update dashboard UI live
        } catch (\Exception $e) {
            Log::warning("Live broadcast update failed: " . $e->getMessage());
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Answer callback query to dismiss loading state on button.
     */
    private function answerCallbackQuery($botToken, $callbackQueryId, $text, $showAlert = false)
    {
        try {
            $url = "https://api.telegram.org/bot{$botToken}/answerCallbackQuery";
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
                'callback_query_id' => $callbackQueryId,
                'text' => $text,
                'show_alert' => $showAlert
            ]));
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_exec($ch);
            curl_close($ch);
        } catch (\Exception $e) {
            Log::warning("Telegram answerCallbackQuery failed: " . $e->getMessage());
        }
    }

    /**
     * Edit Telegram message text and remove the inline keyboard.
     */
    private function editMessageText($botToken, $chatId, $messageId, $text)
    {
        try {
            $url = "https://api.telegram.org/bot{$botToken}/editMessageText";
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
                'chat_id' => $chatId,
                'message_id' => $messageId,
                'text' => $text,
                'parse_mode' => 'HTML',
                'reply_markup' => json_encode(['inline_keyboard' => []]) // Removes all buttons
            ]));
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_exec($ch);
            curl_close($ch);
        } catch (\Exception $e) {
            Log::warning("Telegram editMessageText failed: " . $e->getMessage());
        }
    }

    /**
     * Process plain messages and shared contacts.
     */
    private function handleMessage(array $message, $token)
    {
        $chatId = $message['chat']['id'] ?? null;
        $text = $message['text'] ?? '';

        if (!$chatId || !$token) {
            return response()->json(['status' => 'invalid_message']);
        }

        // Handle contact share
        if (isset($message['contact'])) {
            $contact = $message['contact'];
            $phoneNumber = $contact['phone_number'];

            $normalizedPhone = \App\Helpers\TelegramOTPAcc::normalizeCambodianPhone($phoneNumber);

            // Find store owner who owns this bot token
            $storeOwnerId = Store::where('key', 'telegram_bot_token')->where('value', $token)->value('created_by');

            if ($storeOwnerId) {
                Store::updateOrCreate(
                    ['created_by' => $storeOwnerId, 'key' => "tg_chat_" . $normalizedPhone],
                    ['value' => $chatId]
                );

                $replyText = "✅ <b>Account Linked Successfully!</b>\n\nYour phone number <code>" . htmlspecialchars($phoneNumber) . "</code> is now registered to receive verification OTPs directly in this chat. You can proceed to complete your order checkout.";
                
                $replyMarkup = json_encode([
                    'remove_keyboard' => true
                ]);

                $this->sendMessage($token, $chatId, $replyText, $replyMarkup);
                return response()->json(['status' => 'contact_linked']);
            }
            return response()->json(['status' => 'store_not_found']);
        }

        // Handle commands
        if ($text === '/start' || str_starts_with($text, '/start')) {
            $replyText = "👋 <b>Hello! Welcome to our Store Bot.</b>\n\nTo receive order OTP verification codes directly in this chat, please click the button below to share your phone number:";
            
            $replyMarkup = json_encode([
                'keyboard' => [
                    [
                        [
                            'text' => '📱 Share Phone Number to Verify OTP',
                            'request_contact' => true
                        ]
                    ]
                ],
                'one_time_keyboard' => true,
                'resize_keyboard' => true
            ]);

            $this->sendMessage($token, $chatId, $replyText, $replyMarkup);
            return response()->json(['status' => 'start_handled']);
        }

        return response()->json(['status' => 'message_ignored']);
    }

    /**
     * Send message helper.
     */
    private function sendMessage($botToken, $chatId, $text, $replyMarkup = null)
    {
        try {
            $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            
            $postFields = [
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => 'HTML'
            ];

            if ($replyMarkup) {
                $postFields['reply_markup'] = $replyMarkup;
            }

            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postFields));
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_exec($ch);
            curl_close($ch);
        } catch (\Exception $e) {
            Log::warning("Telegram sendMessage failed: " . $e->getMessage());
        }
    }
}
