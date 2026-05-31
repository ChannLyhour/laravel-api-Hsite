<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Product;

$products = Product::with(['translations', 'variants.attributeValues.attribute'])->get();
foreach ($products as $p) {
    echo "ID: {$p->id} | SKU: {$p->sku} | Status: {$p->status}\n";
    foreach ($p->translations as $t) {
        echo "  Translation ({$t->locale}): {$t->name}\n";
    }
    foreach ($p->variants as $v) {
        echo "  Variant SKU: {$v->variant_sku} | Price: {$v->retail_price} | Stock: {$v->stock_qty}\n";
        foreach ($v->attributeValues as $av) {
            echo "    Attribute: {$av->attribute->name} = {$av->value}\n";
        }
    }
}
