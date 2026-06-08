<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Order;

$order = Order::with(['items.productVariant.product', 'store'])->latest()->first();

if (!$order) {
    echo "No orders found in database.\n";
    exit;
}

echo "ORDER ID: " . $order->id . "\n";
echo "ORDER JSON:\n";
echo json_encode($order->toArray(), JSON_PRETTY_PRINT) . "\n";
