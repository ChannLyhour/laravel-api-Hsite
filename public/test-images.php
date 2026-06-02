<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$product = \App\Models\Product::find(11);
if ($product) {
    echo "Product: " . json_encode($product) . "\n";
} else {
    echo "Product 11 not found\n";
}

$images = \Illuminate\Support\Facades\DB::table('product_images')->where('product_id', 11)->get();
echo "product_images table count for product 11: " . $images->count() . "\n";
foreach ($images as $img) {
    echo json_encode($img) . "\n";
}
