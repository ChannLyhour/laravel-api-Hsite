<?php

use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Api\v1\ChatController;
use Illuminate\Http\Request;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

$request = Request::create('/chat/conversations', 'GET');
$app->instance('request', $request);

$user = App\Models\User::find(4);
$request->setUserResolver(fn() => $user);

$controller = app(ChatController::class);
try {
    $res = $controller->getConversations($request);
    echo "Chat controller response status: " . $res->getStatusCode() . "\n";
    echo "Content: " . substr($res->getContent(), 0, 500) . "\n";
} catch (\Throwable $e) {
    echo "Exception thrown: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
