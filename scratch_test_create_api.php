<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\v1\Owner\ProductController;

$user = User::where('role_id', 30003)->first();
if (!$user) {
    echo "No admin user found\n";
    exit;
}

$request = Request::create("/api/v1/owner/products", 'POST', [
    'sku' => 'PROD-STORE-TEST-' . rand(100, 999),
    'status' => 'active',
    'translations' => [
        [
            'locale' => 'en',
            'name' => 'Store Test Product',
            'slug' => 'store-test-product',
        ]
    ],
    'variants' => [
        [
            'variant_sku' => 'VAR-STORE-TEST-' . rand(100, 999),
            'purchase_price' => '0.00',
            'retail_price' => '20.00',
            'stock_qty' => 100,
            'attribute_values' => [1]
        ]
    ]
]);

$request->setUserResolver(function () use ($user) {
    return $user;
});

$controller = new ProductController();
try {
    $response = $controller->store($request);
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Content: " . $response->getContent() . "\n";
} catch (\Exception $e) {
    echo "Exception occurred: " . $e->getMessage() . "\n";
}
