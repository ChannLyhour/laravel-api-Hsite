<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Order;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;

function dispatchRequest($method, $uri, $data = [], $headers = []) {
    $request = Request::create($uri, $method, $data);
    $request->headers->add($headers);
    $request->headers->set('Accept', 'application/json');
    $response = app()->handle($request);
    return json_decode($response->getContent(), true);
}

echo "=== START CHECK TRANSACTION STATUS TEST ===\n";

// 1. Temporarily restore order 87
$order = Order::withTrashed()->find(87);
if (!$order) {
    echo "ERROR: Order 87 not found.\n";
    exit(1);
}
$order->restore();
echo "Order 87 restored.\n";

// Reset transaction status to pending
$txn = PaymentTransaction::where('transaction_id', 'TXN-87-1781163729')->first();
if ($txn) {
    $txn->update(['status' => 'pending']);
    echo "Transaction status reset to pending.\n";
}

// 2. Call the check-transaction API
$payload = [
    'transaction_id' => 'TXN-87-1781163729'
];

echo "Calling /api/payments/check-transaction...\n";
$response = dispatchRequest('POST', '/api/payments/check-transaction', $payload);

echo "API Response:\n";
print_r($response);

// 3. Cleanup: Soft-delete order 87 again
$order->delete();
echo "Order 87 soft-deleted again.\n";

echo "=== TEST COMPLETED ===\n";
