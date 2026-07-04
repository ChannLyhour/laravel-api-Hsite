<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$order = \App\Models\Order::latest()->first();
$otpCode = '123456';

try {
    echo "Simulating sendOTP for Order ID: {$order->id}...\n";
    \App\Helpers\TelegramOTPAcc::sendOTP($order, $otpCode);
    echo "Done!\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
