<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

$user = User::where('role_id', 30003)->first();
if (!$user) {
    echo "No admin user found\n";
    exit;
}

try {
    DB::beginTransaction();

    // Try creating product and variants with attribute sync
    $product = Product::create([
        'category_id' => null,
        'sku' => 'PROD-TEST-' . rand(100, 999),
        'barcode' => null,
        'status' => 'active',
        'created_by' => $user->id,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'variant_sku' => $product->sku . '-GLO',
        'region_code' => 'GLO',
        'currency_code' => 'USD',
        'purchase_price' => 0.00,
        'retail_price' => 10.00,
        'stock_qty' => 100,
        'created_by' => $user->id,
    ]);

    // Let's see if we can sync attribute values
    $variant->attributeValues()->sync([1, 2]);

    echo "Create and Sync succeeded!\n";

    // Try updating
    $variant->update([
        'retail_price' => 12.00
    ]);
    $variant->attributeValues()->sync([1]); // update attributes

    echo "Update and Sync succeeded!\n";

    DB::rollBack();
} catch (\Exception $e) {
    DB::rollBack();
    echo "Error occurred: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
