<?php

use App\Http\Controllers\Api\v1\AuthController;
use App\Http\Controllers\Api\v1\Admin\UserController;
use App\Http\Controllers\Api\v1\CategoryController;
use App\Http\Controllers\Api\v1\Owner\ProductController;
use App\Http\Controllers\Api\v1\Owner\ProductAttributeController;
use App\Http\Controllers\Api\v1\Owner\ProductVariantController;
use App\Http\Controllers\Api\v1\Owner\ProductImageController;
use App\Http\Controllers\Api\v1\ProductRatingController;
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

// Products (Public)
Route::get('/products/top-selling', [ProductController::class, 'topSelling']);
Route::get('/products/{id}', [ProductController::class, 'show'])->whereNumber('id');
Route::get('/products/{id}/variants', [ProductVariantController::class, 'index'])->whereNumber('id');
Route::get('/products/{id}/ratings', [ProductRatingController::class, 'index'])->whereNumber('id');
Route::get('/attributes', [ProductAttributeController::class, 'index']);

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

    // Products Manager
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update'])->whereNumber('id');
    Route::post('/products/{id}', [ProductController::class, 'update'])->whereNumber('id');
    Route::delete('/products/{id}', [ProductController::class, 'destroy'])->whereNumber('id');

    // Product Variants Manager (Protected)
    Route::post('/products/{id}/variants', [ProductVariantController::class, 'store'])->whereNumber('id');
    Route::put('/products/variants/{id}', [ProductVariantController::class, 'update'])->whereNumber('id');
    Route::delete('/products/variants/{id}', [ProductVariantController::class, 'destroy'])->whereNumber('id');

    // Product Dynamic Attributes Manager (Protected)
    Route::post('/attributes', [ProductAttributeController::class, 'store']);
    Route::post('/attributes/{id}/values', [ProductAttributeController::class, 'storeValue'])->whereNumber('id');
    Route::delete('/attributes/values/{value_id}', [ProductAttributeController::class, 'destroyValue'])->whereNumber('value_id');
    Route::delete('/attributes/{id}', [ProductAttributeController::class, 'destroy'])->whereNumber('id');

    // Product Image Gallery Manager (Protected)
    Route::post('/products/{id}/images', [ProductImageController::class, 'store'])->whereNumber('id');
    Route::delete('/products/images/{id}', [ProductImageController::class, 'destroy'])->whereNumber('id');

    // Product Customer Ratings Manager (Protected)
    Route::post('/products/{id}/ratings', [ProductRatingController::class, 'store'])->whereNumber('id');

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
