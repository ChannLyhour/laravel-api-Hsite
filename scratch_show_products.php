<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Product;

$products = Product::all();
echo "Total products: " . $products->count() . "\n";
foreach ($products as $p) {
    echo "ID: {$p->id}, SKU: {$p->sku}, Status: {$p->status}, Created By: {$p->created_by}\n";
}
