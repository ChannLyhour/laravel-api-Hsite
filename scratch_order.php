<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$order = App\Models\Order::with(['items.productVariant.product'])->first();
if ($order) {
    echo json_encode($order->toArray(), JSON_PRETTY_PRINT);
}
