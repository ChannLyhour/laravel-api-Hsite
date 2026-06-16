<?php
/**
 * Full test of KhqrBakongController.generateQr with the real store config.
 * Run via: php artisan tinker scratch_test_khqr_real.php
 */

use App\Http\Controllers\Api\v1\Owner\KhqrBakongController;
use App\Models\User;
use App\Models\Order;
use Illuminate\Http\Request;

// Get owner user (the one who has bakong configured)
$user = User::where('role_id', 30003)->first() ?? User::first();
echo "Testing as: {$user->name} (ID: {$user->id})\n";

// === TEST 1: Generate QR without order_id (standalone payment) ===
echo "\n=== TEST 1: Standalone QR (no order_id) ===\n";
$request = new Request();
$request->setUserResolver(fn() => $user);
$request->merge([
    'amount'   => 0.10,
    'currency' => 'USD',
    'bill_no'  => 'STANDALONE-001',
]);

$controller = new KhqrBakongController();
$response = $controller->generateQr($request);
$data = json_decode($response->getContent(), true);

if ($data['success']) {
    $qr = $data['qrString'];
    echo "QR String: {$qr}\n";
    echo "MD5: {$data['md5']}\n";
    echo "Merchant: " . json_encode($data['merchant_info']) . "\n";
    
    // Validate format
    $hasGuid  = str_contains($qr, 'kh.gov.nbc.bakong');
    $hasAcct  = str_contains($qr, $data['merchant_info']['bakong_account_id']);
    $hasTag29 = str_contains($qr, '2942') || str_contains($qr, '2940') || str_contains($qr, '2941') || str_contains($qr, '2943') || str_contains($qr, '2944');
    
    echo "\n✅ Has official GUID (kh.gov.nbc.bakong): " . ($hasGuid ? 'YES' : 'NO - BROKEN!') . "\n";
    echo "✅ Has account ID in payload: " . ($hasAcct ? 'YES' : 'NO - BROKEN!') . "\n";
} else {
    echo "❌ Error: " . ($data['message'] ?? 'Unknown error') . "\n";
}

// === TEST 2: Generate QR with order_id ===
echo "\n=== TEST 2: QR with order_id ===\n";
$order = Order::first();
if ($order) {
    echo "Order ID: {$order->id}, Amount: {$order->total_amount}\n";
    $request2 = new Request();
    $request2->setUserResolver(fn() => $user);
    $request2->merge([
        'order_id' => $order->id,
        'currency' => 'USD',
    ]);
    $response2 = $controller->generateQr($request2);
    $data2 = json_decode($response2->getContent(), true);
    if ($data2['success']) {
        $qr2 = $data2['qrString'];
        echo "QR String: {$qr2}\n";
        $hasGuid2 = str_contains($qr2, 'kh.gov.nbc.bakong');
        echo "✅ Has official GUID: " . ($hasGuid2 ? 'YES' : 'NO - BROKEN!') . "\n";
    } else {
        echo "❌ Error: " . ($data2['message'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "No orders in database - skipped.\n";
}
