<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ProductImage;
use Illuminate\Support\Facades\DB;

$images = DB::table('product_images')->get();
foreach ($images as $img) {
    echo "ID: {$img->id} | Product ID: {$img->product_id} | Image (raw): {$img->image} | Is Primary: {$img->is_primary} | Sort Order: {$img->sort_order}\n";
}
