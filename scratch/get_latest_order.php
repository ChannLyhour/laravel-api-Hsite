<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\Store;

$order = Order::latest()->first();

if (!$order) {
    echo "No orders found.\n";
    exit;
}

echo "Latest Order Details:\n";
echo "- ID: {$order->id}\n";
echo "- Order No: {$order->order_no}\n";
echo "- Store ID: {$order->store_id}\n";
echo "- Customer Name: {$order->customer_name}\n";
echo "- Total Amount: {$order->total_amount}\n";
echo "- Created At: {$order->created_at}\n\n";

// Check store configuration for this store ID
$storeId = $order->store_id;
$settings = Store::where('created_by', $storeId)->get();
echo "Store Settings count for owner_id={$storeId}: " . $settings->count() . "\n";
foreach ($settings as $s) {
    if (in_array($s->key, ['telegram_enabled', 'telegram_bot_token', 'telegram_chat_id'])) {
        echo "  - {$s->key}: " . ($s->key === 'telegram_bot_token' ? substr($s->value, 0, 10) . '...' : $s->value) . "\n";
    }
}
