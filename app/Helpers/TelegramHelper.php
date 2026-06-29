<?php

namespace App\Helpers;

use App\Models\Store;
use Illuminate\Support\Facades\Log;

class TelegramHelper
{
    /**
     * Send order notification to the store owner's Telegram bot.
     *
     * @param \App\Models\Order $order
     * @return void
     */
    public static function sendOrderNotification ($order)
    {
        $storeId = $order->store_id;
        if (!$storeId) {
            return;
        }

        // Prevent duplicate notifications using Cache lock
        $cacheKey = "telegram_sent_order_{$order->id}";
        if (\Illuminate\Support\Facades\Cache::has($cacheKey)) {
            return;
        }

        // Set cache lock for 10 minutes to prevent concurrent / duplicate sending
        \Illuminate\Support\Facades\Cache::put($cacheKey, true, 600);

        try {
            $enabled = Store::where('created_by', $storeId)->where('key', 'telegram_enabled')->value('value');
            if ($enabled !== '1' && $enabled !== 1 && $enabled !== 'true') {
                return;
            }

            $botToken = Store::where('created_by', $storeId)->where('key', 'telegram_bot_token')->value('value');
            $chatId = Store::where('created_by', $storeId)->where('key', 'telegram_chat_id')->value('value');

            if (!$botToken || !$chatId) {
                return;
            }

            $message = self::formatOrderMessage($order);

            // Construct Inline Keyboard Markup with Confirm and Cancel Buttons
            $replyMarkup = json_encode([
                'inline_keyboard' => [
                    [
                        [
                            'text' => '✅ Confirm Order',
                            'callback_data' => 'confirm_' . $order->id
                        ],
                        [
                            'text' => '❌ Cancel Order',
                            'callback_data' => 'cancel_' . $order->id
                        ]
                    ]
                ]
            ]);

            self::sendMessage($botToken, $chatId, $message, $replyMarkup);
        } catch (\Exception $e) {
            Log::error("Telegram sendOrderNotification failed: " . $e->getMessage());
        }
    }

    /**
     * Format the HTML order message for Telegram notifications.
     *
     * @param \App\Models\Order $order
     * @param string|null $statusBadge
     * @return string
     */
    public static function formatOrderMessage($order, $statusBadge = null)
    {
        // Format items list
        $itemLines = [];
        $order->loadMissing('items');
        foreach ($order->items as $index => $item) {
            $sub = floatval($item->price) * intval($item->quantity);
            $itemName = htmlspecialchars($item->name, ENT_QUOTES, 'UTF-8');
            $itemLines[] = "  " . ($index + 1) . ". " . $itemName . " x" . $item->quantity . " — $" . number_format($sub, 2);
        }
        $itemsText = implode("\n", $itemLines);

        $paymentMethod = $order->payment_method === 'cod' ? 'Cash on Delivery' : $order->payment_method;
        $paymentIcon = $order->payment_status === 'Paid' ? '✅' : '⏳';
        $paymentStatus = $order->payment_status ?? 'Unpaid';

        $customerName = htmlspecialchars($order->customer_name ?? 'Walk-in', ENT_QUOTES, 'UTF-8');
        $customerPhone = htmlspecialchars($order->customer_phone, ENT_QUOTES, 'UTF-8');
        $customerEmail = htmlspecialchars($order->customer_email, ENT_QUOTES, 'UTF-8');
        $customerAddress = htmlspecialchars($order->customer_address, ENT_QUOTES, 'UTF-8');

        $messageLines = [
            "🛒 <b>New Order Received!</b>",
            "",
            "📋 <b>Order:</b> #" . ($order->order_no ?? $order->id),
            "👤 <b>Customer:</b> " . $customerName,
        ];

        if ($order->customer_phone) {
            $messageLines[] = "📞 <b>Phone:</b> " . $customerPhone;
        }
        if ($order->customer_email) {
            $messageLines[] = "📧 <b>Email:</b> " . $customerEmail;
        }

        $messageLines[] = "";
        $messageLines[] = "🍽 <b>Items:</b>";
        $messageLines[] = $itemsText;
        $messageLines[] = "";
        $messageLines[] = "💰 <b>Total:</b> $" . number_format(floatval($order->total_amount), 2);
        $messageLines[] = "💳 <b>Payment:</b> " . $paymentMethod . " " . $paymentIcon . " " . $paymentStatus;

        if ($order->customer_address && $order->customer_address !== 'POS Walk-in') {
            $messageLines[] = "📍 <b>Address:</b> " . $customerAddress;
        } else {
            $messageLines[] = "📍 <b>Type:</b> Walk-in / POS";
        }

        // Add direct owner dashboard link if we can resolve the store owner
        $storeId = $order->store_id;
        if ($storeId) {
            $owner = \App\Models\User::find($storeId);
            if ($owner) {
                $ownerHashId = $owner->hashid ?? \Vinkla\Hashids\Facades\Hashids::encode($storeId);
                $storeNameSetting = Store::where('created_by', $storeId)->where('key', 'store_name')->value('value');
                $storeSlug = $storeNameSetting ? preg_replace('/[^a-zA-Z0-9]/', '', $storeNameSetting) : 'store';
                $customDomain = Store::where('created_by', $storeId)->where('key', 'custom_domain')->value('value');
                $baseUrl = $customDomain ? "https://" . $customDomain : "http://lvh.me:5173";
                $dashboardUrl = $baseUrl . "/owner?store=" . urlencode($storeSlug) . "&id=" . urlencode($ownerHashId) . "&tab=orders&order_id=" . urlencode($order->id);
                
                $messageLines[] = "";
                $messageLines[] = "🔗 <a href=\"" . $dashboardUrl . "\"><b>Manage Order in Dashboard</b></a>";
            }
        }

        if ($statusBadge) {
            $messageLines[] = "";
            $messageLines[] = $statusBadge;
        }

        $messageLines[] = "";
        $messageLines[] = "⏰ " . ($order->created_at ? $order->created_at->format('M d, Y, h:i A') : now()->format('M d, Y, h:i A'));

        return implode("\n", $messageLines);
    }


    /**
     * Send raw message via Telegram HTTP API.
     *
     * @param string $botToken
     * @param string $chatId
     * @param string $text
     * @param string|null $replyMarkup
     * @return array|null
     */
    private static function sendMessage ($botToken, $chatId, $text, $replyMarkup = null)
    {
        try {
            $url = "https://api.telegram.org/bot" . $botToken . "/sendMessage";
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
            curl_setopt($ch, CURLOPT_TIMEOUT, 3);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Ignore SSL verification to prevent local curl issues
            $response = curl_exec($ch);
            curl_close($ch);
            return json_decode($response, true);
        } catch (\Exception $e) {
            Log::warning("Telegram sendMessage request failed: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Auto-register webhook with Telegram.
     *
     * @param string $botToken
     * @param string $baseUrl
     * @return void
     */
    public static function registerWebhook ($botToken, $baseUrl)
    {
        if (!$botToken || !$baseUrl) {
            return;
        }

        try {
            // Exclude local dev loopback URLs as Telegram webhook requires public HTTPS
            if (str_contains($baseUrl, 'localhost') || str_contains($baseUrl, '127.0.0.1')) {
                Log::info("Local environment: skipping Telegram webhook auto-registration for URL {$baseUrl}. Webhook can be tested using ngrok/localtunnel.");
                return;
            }

            $webhookUrl = $baseUrl . "/api/telegram/webhook?token=" . urlencode($botToken);
            $url = "https://api.telegram.org/bot" . $botToken . "/setWebhook";
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
                'url' => $webhookUrl
            ]));
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $response = curl_exec($ch);
            curl_close($ch);
            Log::info("Telegram setWebhook response: " . $response);
        } catch (\Exception $e) {
            Log::warning("Telegram setWebhook failed: " . $e->getMessage());
        }
    }
}
