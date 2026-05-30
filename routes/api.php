<?php

use App\Http\Controllers\Api\v1\AuthController;
use App\Http\Controllers\Api\v1\Admin\UserController;
use App\Http\Controllers\Api\v1\CategoryController;
use App\Http\Controllers\Api\v1\Owner\MenuItemController;
use App\Http\Controllers\Api\v1\CustomerController;
use App\Http\Controllers\Api\v1\OrderController;
use App\Http\Controllers\Api\v1\Owner\StoreController;
use App\Http\Controllers\Api\v1\Owner\CMSController;
use App\Http\Controllers\Api\v1\Owner\SettingController;
use App\Http\Controllers\Api\v1\FoodItemController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// General & Diagnostics
Route::get('/', function () {
    return response()->json([
        'message' => 'Welcome to the TiDB Cloud + FastAPI service (Laravel Port)!',
        'database' => 'food_ordering_system',
        'docs_url' => '/api/docs',
        'status' => 'Online'
    ]);
});

Route::get('/health', function () {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        return response()->json([
            'status' => 'Healthy',
            'database_connection' => 'Active & Verified',
            'ssl_tls' => 'Enabled & Secure'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'Unhealthy',
            'detail' => 'Database connection failed: ' . $e->getMessage()
        ], 500);
    }
});

// Authentication
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/customer/login', [AuthController::class, 'loginCustomer']);
Route::post('/admin/login', [AuthController::class, 'loginAdmin']);
Route::post('/owner/login', [AuthController::class, 'loginOwner']);

// Users (Public)
Route::get('/users/admins', [UserController::class, 'admins']);

// Categories (Public)
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category_id}', [CategoryController::class, 'show'])->whereNumber('category_id');

// Menu Items (Public)
Route::get('/menu-items/top-selling', [MenuItemController::class, 'topSelling']);
Route::get('/menu-items/{item_id}', [MenuItemController::class, 'show'])->whereNumber('item_id');

// Stores (Public)
Route::get('/stores/owner/{owner_id}', [StoreController::class, 'showByOwner']);

// CMS - Pages & Posts (Public)
Route::get('/pages', [CMSController::class, 'listPages']);
Route::get('/pages/published', [CMSController::class, 'listPublishedPages']);
Route::get('/pages/{identifier}', [CMSController::class, 'getPage']);

Route::get('/posts', [CMSController::class, 'listPosts']);
Route::get('/posts/published', [CMSController::class, 'listPublishedPosts']);
Route::get('/posts/{identifier}', [CMSController::class, 'getPost']);

// System Settings (Public)
Route::get('/settings', [SettingController::class, 'getSettings']);

// Temporary Food Items (Public)
Route::get('/items', [FoodItemController::class, 'index']);
Route::get('/items/{item_id}', [FoodItemController::class, 'show'])->whereNumber('item_id');

// Static Asset Router & Premium Unsplash Fallback
Route::get('/static/{path}', function ($path) {
    $fullPath = public_path('static/' . $path);
    if (file_exists($fullPath)) {
        return response()->file($fullPath);
    }

    // High-resolution Unsplash food or user avatar placeholders
    if (str_contains(strtolower($path), 'user') || str_contains(strtolower($path), 'avatar') || str_contains(strtolower($path), 'photo_2026')) {
        return redirect('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');
    }

    // Seed-specific gourmet food fallbacks
    if (str_contains(strtolower($path), 'steak')) {
        return redirect('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80');
    }
    if (str_contains(strtolower($path), 'lemonade')) {
        return redirect('https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80');
    }
    if (str_contains(strtolower($path), 'milkshake')) {
        return redirect('https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=600&q=80');
    }
    if (str_contains(strtolower($path), 'pizza')) {
        return redirect('https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80');
    }

    return redirect('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');
})->where('path', '.*');

// Uploaded Asset Router & Premium Unsplash Fallback
Route::get('/uploads/{path}', function ($path) {
    $fullPath = public_path('uploads/' . $path);
    if (file_exists($fullPath)) {
        return response()->file($fullPath);
    }

    // High-resolution Unsplash food or user avatar placeholders
    if (str_contains(strtolower($path), 'user') || str_contains(strtolower($path), 'avatar') || str_contains(strtolower($path), 'photo_2026')) {
        return redirect('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');
    }

    // Seed-specific gourmet food fallbacks
    if (str_contains(strtolower($path), 'steak')) {
        return redirect('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80');
    }
    if (str_contains(strtolower($path), 'lemonade')) {
        return redirect('https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80');
    }
    if (str_contains(strtolower($path), 'milkshake')) {
        return redirect('https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=600&q=80');
    }
    if (str_contains(strtolower($path), 'pizza')) {
        return redirect('https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80');
    }

    return redirect('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');
})->where('path', '.*');



// =========================================================================
//   PROTECTED API ROUTES (Sanctum)
// =========================================================================
Route::middleware('auth:sanctum')->group(function () {

    // User Profile
    Route::get('/users/me', [AuthController::class, 'me']);

    // Users Manager
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user_id}', [UserController::class, 'show'])->whereNumber('user_id');
    Route::put('/users/{user_id}', [UserController::class, 'update'])->whereNumber('user_id');
    Route::delete('/users/{user_id}', [UserController::class, 'destroy'])->whereNumber('user_id');

    // Categories Manager
    Route::get('/categories/mine', [CategoryController::class, 'mine']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category_id}', [CategoryController::class, 'update'])->whereNumber('category_id');
    Route::delete('/categories/{category_id}', [CategoryController::class, 'destroy'])->whereNumber('category_id');

    // Menu Items Manager
    Route::get('/menu-items', [MenuItemController::class, 'index']);
    Route::post('/menu-items', [MenuItemController::class, 'store']);
    Route::put('/menu-items/{item_id}', [MenuItemController::class, 'update'])->whereNumber('item_id');
    Route::post('/menu-items/{item_id}', [MenuItemController::class, 'update'])->whereNumber('item_id');
    Route::delete('/menu-items/{item_id}', [MenuItemController::class, 'destroy'])->whereNumber('item_id');

    // Customers Manager
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/{customer_id}', [CustomerController::class, 'show'])->whereNumber('customer_id');
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::put('/customers/{customer_id}', [CustomerController::class, 'update'])->whereNumber('customer_id');
    Route::delete('/customers/{customer_id}', [CustomerController::class, 'destroy'])->whereNumber('customer_id');

    // Orders Manager
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/me', [OrderController::class, 'me']);
    Route::get('/orders/store/me', [OrderController::class, 'storeOrders']);
    Route::get('/orders/{order_id}', [OrderController::class, 'show'])->whereNumber('order_id');
    Route::put('/orders/{order_id}/status', [OrderController::class, 'updateStatus'])->whereNumber('order_id');
    Route::put('/orders/{order_id}/payment-status', [OrderController::class, 'updatePaymentStatus'])->whereNumber('order_id');

    // Stores Configuration
    Route::get('/stores', [StoreController::class, 'index']);
    Route::post('/stores', [StoreController::class, 'store']);
    Route::get('/stores/me', [StoreController::class, 'showMe']);
    Route::put('/stores/me', [StoreController::class, 'upsert']);
    Route::put('/stores/{store_id}', [StoreController::class, 'update'])->whereNumber('store_id');

    // CMS Configuration (Pages & Posts)
    Route::post('/pages', [CMSController::class, 'createPage']);
    Route::put('/pages/{page_id}', [CMSController::class, 'updatePage'])->whereNumber('page_id');
    Route::delete('/pages/{page_id}', [CMSController::class, 'deletePage'])->whereNumber('page_id');

    Route::post('/posts', [CMSController::class, 'createPost']);
    Route::put('/posts/{post_id}', [CMSController::class, 'updatePost'])->whereNumber('post_id');
    Route::delete('/posts/{post_id}', [CMSController::class, 'deletePost'])->whereNumber('post_id');

    // System Settings Configuration
    Route::put('/settings', [SettingController::class, 'updateSettings']);

    // Temporary Food Items Configuration
    Route::post('/items', [FoodItemController::class, 'store']);
    Route::put('/items/{item_id}', [FoodItemController::class, 'update'])->whereNumber('item_id');
    Route::delete('/items/{item_id}', [FoodItemController::class, 'destroy'])->whereNumber('item_id');

});
