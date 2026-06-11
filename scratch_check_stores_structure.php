<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Store;
use Illuminate\Support\Facades\DB;

$allPaymentConfigs = Store::where('key', 'payment_methods')->get();
foreach ($allPaymentConfigs as $config) {
    echo "ID: {$config->id} | Key: {$config->key} | Created By (Owner ID): {$config->created_by}\n";
}

$config = DB::table('stores')->where('created_by', 4)->where('key', 'payment_methods')->first();
if ($config) {
    echo "Value for Owner 4: {$config->value}\n";
} else {
    echo "No config found for Owner 4!\n";
}
