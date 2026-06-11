<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$columns = DB::select('DESCRIBE stores');
foreach ($columns as $col) {
    echo "Field: {$col->Field} | Type: {$col->Type} | Null: {$col->Null} | Key: {$col->Key}\n";
}
