<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Order;
use App\Models\Coupon;
use App\Models\OrderItem;
use Illuminate\Http\Request;

// Helper to run a controller method via Request routing
function dispatchRequest($method, $uri, $data = [], $headers = []) {
    $request = Request::create($uri, $method, $data);
    $request->headers->add($headers);
    $request->headers->set('Accept', 'application/json');
    
    // Set route resolver
    $response = app()->handle($request);
    return json_decode($response->getContent(), true);
}

echo "=== START ABA CHECKOUT FLOW TEST ===\n";

// 1. Get initial coupon count
$couponCode = 'TBL993VY';
$coupon = Coupon::where('code', $couponCode)->first();
if (!$coupon) {
    echo "ERROR: Coupon $couponCode not found.\n";
    exit(1);
}
$initialUsed = $coupon->total_used;
echo "Initial Coupon Used: $initialUsed\n";

// 2. Prepare order payload
$payload = [
    'customer_name' => 'Test Runner',
    'customer_phone' => '099888777',
    'customer_email' => 'test@example.com',
    'customer_address' => 'Phnom Penh, Cambodia',
    'store_id' => 1,
    'total_amount' => 40.00,
    'coupon_code' => $couponCode,
    'payment_method' => 'aba',
    'items' => [
        [
            'menu_item_id' => 1,
            'product_variant_id' => 21,
            'quantity' => 1,
            'price' => 40.00,
            'name' => 'Classic White Crewneck T-Shirt'
        ]
    ]
];

echo "Creating test order...\n";
$createRes = dispatchRequest('POST', '/api/orders', $payload);

if (empty($createRes['success']) || !$createRes['success']) {
    echo "ERROR: Failed to create order.\n";
    print_r($createRes);
    exit(1);
}

$order = $createRes['order'];
$orderId = $order['id'];
echo "Order Created Successfully! Order ID: $orderId, Order No: {$order['order_no']}\n";
echo "Order Status: {$order['status']}, Payment Status: {$order['payment_status']}\n";

// Refresh coupon and check increment
$coupon->refresh();
echo "Coupon Used after creation: {$coupon->total_used} (Expected: " . ($initialUsed + 1) . ")\n";
if ($coupon->total_used !== $initialUsed + 1) {
    echo "ERROR: Coupon was not incremented correctly!\n";
    exit(1);
}

// Check that order items exist
$itemsCount = OrderItem::where('order_id', $orderId)->count();
echo "Order items in DB: $itemsCount (Expected: 1)\n";
if ($itemsCount !== 1) {
    echo "ERROR: Order items were not created correctly!\n";
    exit(1);
}

// 3. Delete/Cancel order (Simulate popup close / cancellation)
echo "Deleting/Canceling order (simulating customer canceling / closing KHQR popup)...\n";
$deleteRes = dispatchRequest('DELETE', "/api/orders/{$orderId}");

if (empty($deleteRes['success']) || !$deleteRes['success']) {
    echo "ERROR: Failed to delete order.\n";
    print_r($deleteRes);
    exit(1);
}

echo "Delete Response: {$deleteRes['message']}\n";

// Refresh coupon and check decrement
$coupon->refresh();
echo "Coupon Used after deletion: {$coupon->total_used} (Expected: $initialUsed)\n";
if ($coupon->total_used !== $initialUsed) {
    echo "ERROR: Coupon was not decremented back to original state!\n";
    exit(1);
}

// Verify order and items are removed
$deletedOrder = Order::find($orderId);
if ($deletedOrder) {
    echo "ERROR: Order record still exists in database!\n";
    exit(1);
} else {
    echo "Order soft-deleted successfully (Order::find returned null).\n";
}

$deletedItemsCount = OrderItem::where('order_id', $orderId)->count();
if ($deletedItemsCount > 0) {
    echo "ERROR: Order items still exist in database!\n";
    exit(1);
} else {
    echo "Order items deleted successfully.\n";
}

echo "=== ALL TESTS PASSED SUCCESSFULLY ===\n";
