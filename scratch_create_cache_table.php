<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

echo "Checking if cache table exists...\n";
if (!Schema::hasTable('cache')) {
    echo "Creating cache table...\n";
    Schema::create('cache', function (Blueprint $table) {
        $table->string('key')->primary();
        $table->mediumText('value');
        $table->integer('expiration')->index();
    });
    echo "Cache table created successfully!\n";
} else {
    echo "Cache table already exists!\n";
}
