<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

// Create a mock UploadedFile
$file = UploadedFile::fake()->image('avatar.jpg');

// Create a Request instance
$request = Request::create(
    '/test',
    'POST',
    [],
    [],
    [
        'variants' => [
            0 => [
                'image' => $file
            ]
        ]
    ]
);

echo "Method 1: hasFile('variants.0.image'): " . ($request->hasFile('variants.0.image') ? 'TRUE' : 'FALSE') . "\n";
echo "Method 2: file('variants.0.image') is UploadedFile: " . ($request->file('variants.0.image') instanceof UploadedFile ? 'TRUE' : 'FALSE') . "\n";
