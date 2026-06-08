<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Product;

$product = Product::with(['variants.attributeValues.attribute'])->find(23);

if (!$product) {
    echo "Product 23 not found in database.\n";
    exit;
}

echo "PRODUCT 23 DETAILS:\n";
echo json_encode($product->toArray(), JSON_PRETTY_PRINT) . "\n";
