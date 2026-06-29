<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\Store;

$order = Order::find(90156);
if (!$order) {
    echo "Order 90156 not found.\n";
    exit;
}

$storeId = $order->store_id;
$botToken = Store::where('created_by', $storeId)->where('key', 'telegram_bot_token')->value('value');
$chatId = Store::where('created_by', $storeId)->where('key', 'telegram_chat_id')->value('value');

echo "Sending debug message for Order 90156...\n";
echo "Token: " . substr($botToken, 0, 10) . "...\n";
echo "Chat ID: {$chatId}\n";

// Format items list
$itemLines = [];
$order->loadMissing('items');
foreach ($order->items as $index => $item) {
    $sub = floatval($item->price) * intval($item->quantity);
    $itemLines[] = "  " . ($index + 1) . ". " . $item->name . " x" . $item->quantity . " — $" . number_format($sub, 2);
}
$itemsText = implode("\n", $itemLines);

$paymentMethod = $order->payment_method === 'cod' ? 'Cash on Delivery' : $order->payment_method;
$paymentIcon = $order->payment_status === 'Paid' ? '✅' : '⏳';

$messageLines = [
    "🛒 <b>New Order Received!</b>",
    "",
    "📋 <b>Order:</b> #" . ($order->order_no ?? $order->id),
    "👤 <b>Customer:</b> " . ($order->customer_name ?? 'Walk-in'),
];

if ($order->customer_phone) {
    $messageLines[] = "📞 <b>Phone:</b> " . $order->customer_phone;
}
if ($order->customer_email) {
    $messageLines[] = "📧 <b>Email:</b> " . $order->customer_email;
}

$messageLines[] = "";
$messageLines[] = "🍽 <b>Items:</b>";
$messageLines[] = $itemsText;
$messageLines[] = "";
$messageLines[] = "💰 <b>Total:</b> $" . number_format(floatval($order->total_amount), 2);
$messageLines[] = "💳 <b>Payment:</b> " . $paymentMethod . " " . $paymentIcon . " " . ($order->payment_status ?? 'Unpaid');

if ($order->customer_address && $order->customer_address !== 'POS Walk-in') {
    $messageLines[] = "📍 <b>Address:</b> " . $order->customer_address;
} else {
    $messageLines[] = "📍 <b>Type:</b> Walk-in / POS";
}

// Resolve Owner Dashboard details to build direct order management link
$owner = \App\Models\User::find($storeId);
$ownerHashId = $owner ? $owner->hashid : \Vinkla\Hashids\Facades\Hashids::encode($storeId);
$storeNameSetting = Store::where('created_by', $storeId)->where('key', 'store_name')->value('value');
$storeSlug = $storeNameSetting ? preg_replace('/[^a-zA-Z0-9]/', '', $storeNameSetting) : 'store';

$customDomain = Store::where('created_by', $storeId)->where('key', 'custom_domain')->value('value');
$baseUrl = $customDomain ? "https://" . $customDomain : "http://lvh.me:5173";
$dashboardUrl = $baseUrl . "/owner?store=" . urlencode($storeSlug) . "&id=" . urlencode($ownerHashId) . "&tab=orders&order_id=" . urlencode($order->id);

$messageLines[] = "";
$messageLines[] = "🔗 <a href=\"" . $dashboardUrl . "\"><b>Manage Order in Dashboard</b></a>";
$messageLines[] = "";
$messageLines[] = "⏰ " . ($order->created_at ? $order->created_at->format('M d, Y, h:i A') : now()->format('M d, Y, h:i A'));

$message = implode("\n", $messageLines);

// Construct Inline Keyboard Markup with Confirm and Cancel URL Buttons
$replyMarkup = json_encode([
    'inline_keyboard' => [
        [
            [
                'text' => '✅ Confirm Order',
                'url' => $dashboardUrl . "&action=confirm"
            ],
            [
                'text' => '❌ Cancel Order',
                'url' => $dashboardUrl . "&action=cancel"
            ]
        ]
    ]
]);

// Call Telegram directly and dump response
$url = "https://api.telegram.org/bot" . $botToken . "/sendMessage";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'chat_id' => $chatId,
    'text' => $message,
    'parse_mode' => 'HTML',
    'reply_markup' => $replyMarkup
]));
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$response = curl_exec($ch);
$err = curl_error($ch);
curl_close($ch);

if ($err) {
    echo "cURL Error: {$err}\n";
} else {
    echo "Response:\n";
    print_r(json_decode($response, true));
    echo "\n";
}
