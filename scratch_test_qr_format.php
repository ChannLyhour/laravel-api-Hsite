<?php
require __DIR__ . '/vendor/autoload.php';

use SimpleSoftwareIO\QrCode\Generator;

$qrcode = new Generator;

try {
    echo "Testing PNG generation...\n";
    $png = $qrcode->format('png')->size(100)->generate('test');
    echo "✅ PNG OK (length: " . strlen($png) . ")\n";
} catch (\Exception $e) {
    echo "❌ PNG Failed: " . $e->getMessage() . "\n";
}

try {
    echo "\nTesting SVG generation...\n";
    $svg = $qrcode->format('svg')->size(100)->generate('test');
    echo "✅ SVG OK (length: " . strlen($svg) . ")\n";
} catch (\Exception $e) {
    echo "❌ SVG Failed: " . $e->getMessage() . "\n";
}

try {
    echo "\nTesting WebP conversion via Intervention...\n";
    // First generate SVG
    $svg = $qrcode->format('svg')->size(300)->generate('test');
    
    // SVG cannot be read directly by GD driver in Intervention without Imagick.
    // Let's try to generate PNG first (if possible) or just use SVG directly.
    echo "SVG length: " . strlen($svg) . "\n";
    
    // Since we don't have Imagick for SVG->WEBP, 
    // the user might prefer just SVG or we might need to use PNG as source.
    echo "Trying PNG as source for WebP...\n";
    $png = $qrcode->format('png')->size(300)->generate('test');
    
    $imageManager = new \Intervention\Image\ImageManager(\Intervention\Image\Drivers\Gd\Driver::class);
    $img = $imageManager->read($png);
    $webp = $img->encode(new \Intervention\Image\Encoders\WebpEncoder(90));
    
    echo "✅ WebP via Intervention OK (length: " . strlen($webp) . ")\n";
} catch (\Exception $e) {
    echo "❌ WebP via Intervention Failed: " . $e->getMessage() . "\n";
}
