<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Models\Store;
use Illuminate\Support\Facades\Log;

class TelegramPoll extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:poll';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Poll Telegram API for button clicks (Callback Queries) to manage orders';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting Telegram long-polling service...");
        Log::info("Telegram long-polling service started.");

        // Keep track of offsets and webhook deletion status per bot token
        $offsets = [];
        $deletedWebhooks = [];

        while (true) {
            try {
                // Fetch all active bot tokens from database
                $stores = Store::where('stores.key', 'telegram_enabled')
                    ->where('stores.value', '1')
                    ->join('stores as s2', 'stores.created_by', '=', 's2.created_by')
                    ->where('s2.key', 'telegram_bot_token')
                    ->select('s2.value as bot_token', 'stores.created_by as store_id')
                    ->get()
                    ->unique('bot_token');

                if ($stores->isEmpty()) {
                    $this->info("No active Telegram bots configured. Waiting 10 seconds...");
                    sleep(10);
                    continue;
                }

                foreach ($stores as $store) {
                    $botToken = $store->bot_token;

                    // Automatically delete webhook once per bot during this command lifetime
                    if (!isset($deletedWebhooks[$botToken])) {
                        $this->info("Deleting webhook for bot to enable long-polling...");
                        $delUrl = "https://api.telegram.org/bot{$botToken}/deleteWebhook";
                        $ch = curl_init();
                        curl_setopt($ch, CURLOPT_URL, $delUrl);
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                        curl_exec($ch);
                        curl_close($ch);
                        $deletedWebhooks[$botToken] = true;
                    }

                    $offset = $offsets[$botToken] ?? 0;

                    $url = "https://api.telegram.org/bot{$botToken}/getUpdates?offset={$offset}&timeout=5";
                    $ch = curl_init();
                    curl_setopt($ch, CURLOPT_URL, $url);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                    $response = curl_exec($ch);
                    curl_close($ch);

                    if (!$response) {
                        continue;
                    }

                    $data = json_decode($response, true);
                    if (!isset($data['ok']) || !$data['ok'] || empty($data['result'])) {
                        continue;
                    }

                    foreach ($data['result'] as $update) {
                        // Update offset to acknowledge this message
                        $offsets[$botToken] = $update['update_id'] + 1;

                        if (isset($update['callback_query'])) {
                            $this->handleCallbackQuery($botToken, $update['callback_query']);
                        } elseif (isset($update['message'])) {
                            $this->handleMessage($botToken, $update['message']);
                        }
                    }
                }
            } catch (\Exception $e) {
                $this->error("Error in polling loop: " . $e->getMessage());
                Log::error("Telegram poll error: " . $e->getMessage());
            }

            sleep(1); // Sleep 1 second between ticks
        }
    }

    /**
     * Process callback query from button clicks.
     */
    private function handleCallbackQuery($botToken, array $callbackQuery)
    {
        $callbackId = $callbackQuery['id'];
        $data = $callbackQuery['data'] ?? ''; // e.g. "confirm_90151" or "cancel_90151"
        $chatId = $callbackQuery['message']['chat']['id'] ?? null;
        $messageId = $callbackQuery['message']['message_id'] ?? null;
        $originalText = $callbackQuery['message']['text'] ?? '';

        $this->info("Button clicked: data={$data}, chat={$chatId}");

        $parts = explode('_', $data);
        if (count($parts) < 2) {
            return;
        }

        $action = $parts[0];
        $orderId = $parts[1];

        $order = Order::find($orderId);
        if (!$order) {
            $this->answerCallbackQuery($botToken, $callbackId, "❌ Order not found.");
            return;
        }

        if ($action === 'confirm') {
            if ($order->status === 'confirm' || $order->status === 'confirmed') {
                $this->answerCallbackQuery($botToken, $callbackId, "ℹ️ Order is already confirmed.");
                return;
            }

            $order->update(['status' => 'confirmed']);
            $statusAlert = "✅ Order #{$order->order_no} Confirmed!";
            $badge = "🟢 <b>Status: Confirmed by Owner</b>";
        } elseif ($action === 'cancel') {
            if ($order->status === 'canceled' || $order->status === 'cancelled') {
                $this->answerCallbackQuery($botToken, $callbackId, "ℹ️ Order is already canceled.");
                return;
            }

            $order->update(['status' => 'cancelled']);
            $statusAlert = "❌ Order #{$order->order_no} Canceled.";
            $badge = "🔴 <b>Status: Canceled by Owner</b>";
        } else {
            return;
        }

        // 1. Answer Telegram's callback query
        $this->answerCallbackQuery($botToken, $callbackId, $statusAlert);

        // 2. Edit Telegram message to update status and remove action buttons
        if ($chatId && $messageId) {
            $newText = \App\Helpers\TelegramHelper::formatOrderMessage($order, $badge);
            $this->editMessageText($botToken, $chatId, $messageId, $newText);
        }
    }

    /**
     * Answer callback query.
     */
    private function answerCallbackQuery($botToken, $callbackQueryId, $text)
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
            ]));
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_exec($ch);
            curl_close($ch);
        } catch (\Exception $e) {
            Log::warning("Telegram command answerCallbackQuery failed: " . $e->getMessage());
        }
    }

    /**
     * Edit message text.
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
                'reply_markup' => json_encode(['inline_keyboard' => []])
            ]));
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_exec($ch);
            curl_close($ch);
        } catch (\Exception $e) {
            Log::warning("Telegram command editMessageText failed: " . $e->getMessage());
        }
    }

    /**
     * Process message from polling (commands, contact sharing).
     */
    private function handleMessage($botToken, array $message)
    {
        $chatId = $message['chat']['id'] ?? null;
        $text = $message['text'] ?? '';

        if (!$chatId) {
            return;
        }

        // Handle contact share
        if (isset($message['contact'])) {
            $contact = $message['contact'];
            $phoneNumber = $contact['phone_number'];

            $normalizedPhone = \App\Helpers\TelegramOTPAcc::normalizeCambodianPhone($phoneNumber);

            // Find store owner
            $storeOwnerId = Store::where('key', 'telegram_bot_token')->where('value', $botToken)->value('created_by');

            if ($storeOwnerId) {
                Store::updateOrCreate(
                    ['created_by' => $storeOwnerId, 'key' => "tg_chat_" . $normalizedPhone],
                    ['value' => $chatId]
                );

                $replyText = "✅ <b>Account Linked Successfully!</b>\n\nYour phone number <code>" . htmlspecialchars($phoneNumber) . "</code> is now registered to receive verification OTPs directly in this chat. You can proceed to complete your order checkout.";
                
                $replyMarkup = json_encode([
                    'remove_keyboard' => true
                ]);

                $this->sendMessage($botToken, $chatId, $replyText, $replyMarkup);
                $this->info("Linked phone {$phoneNumber} to Telegram Chat {$chatId}");

                // Auto-send any pending order OTP now that the chat is linked
                \App\Helpers\TelegramOTPAcc::checkAndSendPendingOTP($storeOwnerId, $normalizedPhone, $phoneNumber);
            }
            return;
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

            $this->sendMessage($botToken, $chatId, $replyText, $replyMarkup);
        }
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
            $this->error("Telegram sendMessage failed: " . $e->getMessage());
        }
    }
}
