<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$orders = \App\Models\Order::latest()->take(3)->get();
foreach ($orders as $order) {
    echo "Order ID: {$order->id}, No: {$order->order_no}, Created At: {$order->created_at}, Status: {$order->status}\n";
}
