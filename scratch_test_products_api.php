<?php

// Simulate an HTTP request directly within the Laravel framework context
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::create('/api/products', 'GET')
);

echo "HTTP STATUS: " . $response->getStatusCode() . "\n";
echo "RESPONSE BODY (First 1500 chars):\n";
echo substr($response->getContent(), 0, 1500) . "...\n";

// Let's find product 29 in the array
$data = json_decode($response->getContent(), true);
if (is_array($data)) {
    foreach ($data as $prod) {
        if ($prod['id'] == 29) {
            echo "\nFOUND PRODUCT 29 IN INDEX RESPONSE:\n";
            echo json_encode($prod, JSON_PRETTY_PRINT) . "\n";
            exit;
        }
    }
    echo "\nProduct 29 not found in the list response.\n";
} else {
    echo "\nFailed to decode response as JSON.\n";
}
