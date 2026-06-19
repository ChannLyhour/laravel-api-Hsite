<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "--- product_images columns ---\n";
print_r(Illuminate\Support\Facades\Schema::getColumnListing('product_images'));

echo "--- products columns ---\n";
print_r(Illuminate\Support\Facades\Schema::getColumnListing('products'));
