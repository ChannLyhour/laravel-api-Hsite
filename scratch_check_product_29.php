<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Product;

$product = Product::with(['translations', 'variants.attributeValues.attribute', 'images', 'brand', 'badge', 'addons'])->find(29);

if (!$product) {
    echo "Product 29 not found in database.\n";
    exit;
}

echo "PRODUCT 29 DETAILS:\n";
echo json_encode($product->toArray(), JSON_PRETTY_PRINT) . "\n";
