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

        // Keep track of offsets per bot token
        $offsets = [];

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
}
