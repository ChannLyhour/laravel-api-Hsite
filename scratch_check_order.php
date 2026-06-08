<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$order = App\Models\Order::find(39);
if ($order && $order->items->count() > 0) {
    echo "Item 1 Variant ID: " . $order->items->first()->product_variant_id . "\n";
} else {
    echo "Order or items not found.\n";
}
