<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\v1\Owner\ProductController;

$user = User::where('role_id', 30003)->first();
if (!$user) {
    echo "No admin user found\n";
    exit;
}

$product = Product::first();
if (!$product) {
    echo "No product found\n";
    exit;
}

// Mock request
$request = Request::create("/api/v1/owner/products/{$product->id}", 'PUT', [
    'sku' => $product->sku,
    'status' => 'active',
    'translations' => [
        [
            'locale' => 'en',
            'name' => 'Updated Product Name',
            'slug' => 'updated-product-name',
        ]
    ],
    'variants' => [
        [
            'id' => $product->variants->first()->id,
            'variant_sku' => $product->variants->first()->variant_sku,
            'purchase_price' => '0.00',
            'retail_price' => '15.00',
            'stock_qty' => 100,
        ]
    ]
]);

$request->setUserResolver(function () use ($user) {
    return $user;
});

$controller = new ProductController();
try {
    $response = $controller->update($request, $product->id);
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Content: " . $response->getContent() . "\n";
} catch (\Exception $e) {
    echo "Exception occurred: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
