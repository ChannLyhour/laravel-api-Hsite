<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$order = App\Models\Order::latest()->first();
if ($order) {
    echo "Order ID: {$order->id} | Store ID (from Order): {$order->store_id}\n";
    $paymentMethodsRow = App\Models\Store::where('created_by', $order->store_id)
        ->where('key', 'payment_methods')
        ->first();
    if ($paymentMethodsRow) {
        echo "Config found for store_id {$order->store_id}: {$paymentMethodsRow->value}\n";
    } else {
        echo "No config found for store_id {$order->store_id}!\n";
    }
} else {
    echo "No order found!\n";
}
