<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Helpers\TelegramHelper;

$order = Order::latest()->first();

if (!$order) {
    echo "No orders found in the database to test.\n";
    exit;
}

echo "Testing Telegram Order Notification on Order ID: {$order->id} (Order No: {$order->order_no})\n";
echo "Store ID: {$order->store_id}\n";
echo "Customer: {$order->customer_name}\n";

// Let's print out the configured settings for the store to verify
use App\Models\Store;
$storeId = $order->store_id;
$enabled = Store::where('created_by', $storeId)->where('key', 'telegram_enabled')->value('value');
$botToken = Store::where('created_by', $storeId)->where('key', 'telegram_bot_token')->value('value');
$chatId = Store::where('created_by', $storeId)->where('key', 'telegram_chat_id')->value('value');

echo "\nStore Settings:\n";
echo "- telegram_enabled: " . ($enabled ?? 'N/A') . "\n";
echo "- telegram_bot_token: " . ($botToken ? substr($botToken, 0, 10) . '...' : 'N/A') . "\n";
echo "- telegram_chat_id: " . ($chatId ?? 'N/A') . "\n\n";

if ($enabled !== '1' && $enabled !== 1 && $enabled !== 'true') {
    echo "⚠️ Telegram notifications are NOT enabled for this store in the database. Please configure and enable it in the dashboard first.\n";
} else {
    $cacheKey = "telegram_sent_order_{$order->id}";
    $isLocked = \Illuminate\Support\Facades\Cache::has($cacheKey);
    echo "Cache Key: {$cacheKey} status is " . ($isLocked ? "🔒 LOCKED (will return early)" : "🔓 UNLOCKED") . "\n";

    echo "Sending notification...\n";
    TelegramHelper::sendOrderNotification($order);
    echo "Done!\n";
}
