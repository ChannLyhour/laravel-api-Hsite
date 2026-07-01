<?php

use App\Http\Controllers\Api\v1\AuthController;
use App\Http\Controllers\Api\v1\Admin\UserController;
use App\Http\Controllers\Api\v1\Admin\SettingController;
use App\Http\Controllers\Api\v1\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\v1\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\v1\CategoryController;
use App\Http\Controllers\Api\v1\BrandController;
use App\Http\Controllers\Api\v1\ProductBadgeController;
use App\Http\Controllers\Api\v1\Owner\ProductController;
use App\Http\Controllers\Api\v1\Owner\ProductAttributeController;
use App\Http\Controllers\Api\v1\Owner\ProductVariantController;
use App\Http\Controllers\Api\v1\Owner\ProductImageController;
use App\Http\Controllers\Api\v1\Owner\ProductAddonController;
use App\Http\Controllers\Api\v1\Owner\KhqrBakongController;
use App\Http\Controllers\Api\v1\ProductRatingController;
use App\Http\Controllers\Api\v1\CustomerController;
use App\Http\Controllers\Api\v1\OrderController;
use App\Http\Controllers\Api\v1\Owner\OrderController as OwnerOrderController;
use App\Http\Controllers\Api\v1\Owner\StoreController;
use App\Http\Controllers\Api\v1\Owner\CMSController;
use App\Http\Controllers\Api\v1\FoodItemController;
use App\Http\Controllers\Api\v1\ShareController;
use App\Http\Controllers\Api\v1\SocialMediaController;
use App\Http\Controllers\Api\v1\Owner\BannerController;
use App\Http\Controllers\Api\v1\VendorController;
use App\Http\Controllers\Api\v1\Owner\CouponController;
use App\Http\Controllers\Api\v1\Owner\FlashDealController;
use App\Http\Controllers\Api\v1\Owner\FeaturedDealController;
use App\Http\Controllers\Api\v1\Owner\ClearanceSaleController;
use App\Http\Controllers\Api\v1\Owner\DeliveryMethodController;
use App\Http\Controllers\Api\v1\LikeController;
use App\Http\Controllers\Api\v1\ShippingAddressController;
use App\Http\Controllers\Api\v1\CartController;
use App\Http\Controllers\Api\v1\ChatController;
use App\Http\Controllers\Api\v1\BroadcastAuthController;
use App\Http\Controllers\Api\v1\PaymentController;
use App\Http\Controllers\Api\v1\TemplateController;
use Illuminate\Support\Facades\Route;

// Load broadcast channel definitions (Broadcast::channel(...) calls)
require __DIR__ . '/../routes/channels.php';

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
Route::post('/social-login', [AuthController::class, 'socialLogin']);

// Telegram Bot Webhook
Route::post('/telegram/webhook', [\App\Http\Controllers\Api\v1\TelegramWebhookController::class, 'handle']);

Route::get('/store/resolve-domain', [StoreController::class, 'resolveDomain']);

Route::middleware(['identify-store'])->group(function () {
    // Users (Public)
    Route::get('/users/admins', [UserController::class, 'admins']);

    // Categories (Public)
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category_id}', [CategoryController::class, 'show'])->whereNumber('category_id');

    // Brands (Public)
    Route::get('/brands', [BrandController::class, 'index']);
    Route::get('/brands/{id}', [BrandController::class, 'show'])->whereNumber('id');

    // Product Badges (Public)
    Route::get('/product-badges', [ProductBadgeController::class, 'index']);
    Route::get('/product-badges/{id}', [ProductBadgeController::class, 'show'])->whereNumber('id');

    // Products (Public)
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/top-selling', [ProductController::class, 'topSelling']);
    Route::get('/products/{id}', [ProductController::class, 'show'])->whereNumber('id');
    Route::get('/products/{id}/ratings', [ProductRatingController::class, 'index'])->whereNumber('id');
    Route::get('/attributes', [ProductAttributeController::class, 'index']);

    // Stores (Public)
    Route::get('/stores/owner/{owner_id}', [StoreController::class, 'showByOwner']);

    // CMS - Pages & Posts (Public)
    Route::get('/pages', [CMSController::class, 'listPages']);
    Route::get('/pages/published', [CMSController::class, 'listPublishedPages']);

    // No-Code Custom Page Builder (Public)
    Route::get('/pages/public-builder', [\App\Http\Controllers\Api\v1\Owner\PageController::class, 'getPublicPage']);

    Route::get('/pages/{identifier}', [CMSController::class, 'getPage']);

    Route::get('/posts', [CMSController::class, 'listPosts']);
    Route::get('/posts/published', [CMSController::class, 'listPublishedPosts']);
    Route::get('/posts/{identifier}', [CMSController::class, 'getPost']);

    // System Settings (Public)
    Route::get('/settings', [SettingController::class, 'getSettings']);

    // Shared layout configurations (Public)
    Route::post('/save-share', [ShareController::class, 'save']);
    Route::get('/get-share/{id}', [ShareController::class, 'load']);

    // Social Media Links (Public)
    Route::get('/social-media', [SocialMediaController::class, 'index']);

    // Banners (Public)
    Route::get('/banners', [BannerController::class, 'index']);
    Route::get('/banners/{id}', [BannerController::class, 'show'])->whereNumber('id');

    // Delivery Methods (Public)
    Route::get('/delivery-methods', [DeliveryMethodController::class, 'index']);
    Route::get('/delivery-methods/{id}', [DeliveryMethodController::class, 'show'])->whereNumber('id');

    // Vendors (Public)
    Route::get('/vendors', [VendorController::class, 'index']);
    Route::get('/vendors/{id}', [VendorController::class, 'show'])->whereNumber('id');

    // Coupons (Public)
    Route::get('/coupons', [CouponController::class, 'index']);
    Route::get('/coupons/validate', [CouponController::class, 'validateCode']);
    Route::get('/coupons/{id}', [CouponController::class, 'show'])->whereNumber('id');

    // Flash Deals (Public)
    Route::get('/flash-deals', [FlashDealController::class, 'index']);
    Route::get('/flash-deals/{id}', [FlashDealController::class, 'show'])->whereNumber('id');

    // Featured Deals (Public)
    Route::get('/featured-deals', [FeaturedDealController::class, 'index']);
    Route::get('/featured-deals/{id}', [FeaturedDealController::class, 'show'])->whereNumber('id');

    // Clearance Sales (Public)
    Route::get('/clearance-sales', [ClearanceSaleController::class, 'index']);
    Route::get('/clearance-sales/{id}', [ClearanceSaleController::class, 'show'])->whereNumber('id');

    // Temporary Food Items (Public)
    Route::get('/items', [FoodItemController::class, 'index']);
    Route::get('/items/{item_id}', [FoodItemController::class, 'show'])->whereNumber('item_id');

    // Order Placement (Public / Guest Checkout)
    Route::post('/orders', [OrderController::class, 'store']);
    Route::delete('/orders/{order_id}', [OrderController::class, 'destroy'])->whereNumber('order_id');

    // ABA PayWay integration routes
    Route::post('/payments/generate-qr', [PaymentController::class, 'generateQr']);
    Route::post('/payments/check-transaction', [PaymentController::class, 'checkTransaction']);

    // Paid Templates Routes (Public)
    Route::get('/templates', [TemplateController::class, 'index']);
    Route::get('/templates/{tpl_code}', [TemplateController::class, 'show']);
    Route::get('/templates/download/{token}', [TemplateController::class, 'download']);
    Route::get('/chat/messages/{id}/media', [ChatController::class, 'getMedia'])->whereNumber('id');
});

// =========================================================================
//   PROTECTED API ROUTES (Sanctum)
// =========================================================================
Route::middleware('auth:sanctum')->group(function () {

    // Template ownership and token management (Owner/User)
    Route::get('/templates/{tpl_code}/owned', [TemplateController::class, 'checkOwned']);
    Route::post('/templates/{tpl_code}/purchase', [TemplateController::class, 'purchase']);
    Route::post('/templates/{tpl_code}/token', [TemplateController::class, 'generateToken']);

    // Pusher Channel Authorization — credentials loaded from stores table (NOT from .env)
    Route::post('/broadcasting/auth', [BroadcastAuthController::class, 'authenticate']);

    // Online Presence
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/users/heartbeat', [AuthController::class, 'heartbeat']);
    Route::post('/users/offline', [AuthController::class, 'markOffline']);

    // Global Order Retrieval (Unified for Admin, Owner, Customer)
    Route::get('/orders', [OwnerOrderController::class, 'index']);

    Route::prefix('chat')->group(function () {
        Route::get('/conversations', [ChatController::class, 'getConversations']);
        Route::post('/conversations', [ChatController::class, 'startConversation']);
        Route::get('/conversations/{id}/messages', [ChatController::class, 'getMessages']);
        Route::post('/conversations/{id}/messages', [ChatController::class, 'sendMessage']);
        Route::post('/upload', [ChatController::class, 'uploadMedia']);
        Route::delete('/messages/{id}', [ChatController::class, 'deleteMessage']);
        Route::post('/messages/{id}/pin', [ChatController::class, 'togglePinMessage']);
        Route::post('/messages/{id}/react', [ChatController::class, 'toggleReaction']);
        Route::get('/user-status', [ChatController::class, 'getUserStatus']); // DB poll for online presence
    });

    // ---------------------------------------------------------------------
    //   SUPER ADMIN ONLY ROUTES (Role 1)
    // ---------------------------------------------------------------------
    Route::middleware('super-admin')->group(function () {

        // Global Dashboard Stats
        Route::get('/admin/dashboard', [AdminDashboardController::class, 'index']);

        // Global System Settings Management
        Route::put('/settings', [SettingController::class, 'updateSettings']);
        Route::post('/settings/upload-logo', [SettingController::class, 'uploadLogo']);
        Route::post('/settings/upload-favicon', [SettingController::class, 'uploadFavicon']);

        // Global Users Management
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{user_id}', [UserController::class, 'show'])->whereNumber('user_id');
        Route::put('/users/{user_id}', [UserController::class, 'update'])->whereNumber('user_id');
        Route::post('/users/{user_id}', [UserController::class, 'update'])->whereNumber('user_id');
        Route::delete('/users/{user_id}', [UserController::class, 'destroy'])->whereNumber('user_id');

        // Global Order Oversight
        Route::get('/admin/orders', [AdminOrderController::class, 'index']);
        Route::get('/admin/orders/{id}', [AdminOrderController::class, 'show'])->whereNumber('id');
        Route::put('/admin/orders/{id}/status', [AdminOrderController::class, 'updateStatus'])->whereNumber('id');

        // Global Customer Data
        Route::get('/customers', [CustomerController::class, 'index']);

        // Global Store/Merchant Management
        Route::get('/stores', [StoreController::class, 'index']);
        Route::post('/stores', [StoreController::class, 'store']);
        Route::put('/stores/{id}', [StoreController::class, 'update'])->where('id', '^(?!me$)[a-zA-Z0-9]+$');
    });

    // ---------------------------------------------------------------------
    //   STORE OWNER & ADMIN ROUTES (Role 30003 or 1)
    // ---------------------------------------------------------------------
    Route::middleware('owner')->group(function () {

        // Categories Manager
        Route::get('/categories/mine', [CategoryController::class, 'mine']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category_id}', [CategoryController::class, 'update'])->whereNumber('category_id');
        Route::post('/categories/{category_id}', [CategoryController::class, 'update'])->whereNumber('category_id');
        Route::delete('/categories/{category_id}', [CategoryController::class, 'destroy'])->whereNumber('category_id');

        // Brands Manager
        Route::get('/brands/mine', [BrandController::class, 'mine']);
        Route::post('/brands', [BrandController::class, 'store']);
        Route::post('/brands/upload-logo', [BrandController::class, 'uploadLogo']);
        Route::put('/brands/{id}', [BrandController::class, 'update'])->whereNumber('id');
        Route::post('/brands/{id}', [BrandController::class, 'update'])->whereNumber('id');
        Route::delete('/brands/{id}', [BrandController::class, 'destroy'])->whereNumber('id');

        // Product Badges Manager
        Route::get('/product-badges/mine', [ProductBadgeController::class, 'mine']);
        Route::post('/product-badges', [ProductBadgeController::class, 'store']);
        Route::put('/product-badges/{id}', [ProductBadgeController::class, 'update'])->whereNumber('id');
        Route::post('/product-badges/{id}', [ProductBadgeController::class, 'update'])->whereNumber('id');
        Route::delete('/product-badges/{id}', [ProductBadgeController::class, 'destroy'])->whereNumber('id');

        // Products Manager
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{id}', [ProductController::class, 'update'])->whereNumber('id');
        Route::post('/products/{id}', [ProductController::class, 'update'])->whereNumber('id');
        Route::delete('/products/{id}', [ProductController::class, 'destroy'])->whereNumber('id');

        // Product Variants Manager
        Route::post('/products/{id}/variants', [ProductVariantController::class, 'store'])->whereNumber('id');
        Route::put('/products/variants/{id}', [ProductVariantController::class, 'update'])->whereNumber('id');
        Route::delete('/products/variants/{id}', [ProductVariantController::class, 'destroy'])->whereNumber('id');

        // Product Dynamic Attributes Manager
        Route::post('/attributes', [ProductAttributeController::class, 'store']);
        Route::post('/attributes/{id}/values', [ProductAttributeController::class, 'storeValue'])->whereNumber('id');
        Route::delete('/attributes/values/{value_id}', [ProductAttributeController::class, 'destroyValue'])->whereNumber('value_id');
        Route::delete('/attributes/{id}', [ProductAttributeController::class, 'destroy'])->whereNumber('id');

        // Product Image Gallery Manager
        Route::post('/products/{id}/images', [ProductImageController::class, 'store'])->whereNumber('id');
        Route::put('/products/images/{id}', [ProductImageController::class, 'update'])->whereNumber('id');
        Route::delete('/products/images/{id}', [ProductImageController::class, 'destroy'])->whereNumber('id');

        // Product Addons Manager
        Route::get('/products/{id}/addons', [ProductAddonController::class, 'index'])->whereNumber('id');
        Route::post('/products/{id}/addons', [ProductAddonController::class, 'store'])->whereNumber('id');
        Route::put('/products/addons/{id}', [ProductAddonController::class, 'update'])->whereNumber('id');
        Route::delete('/products/addons/{id}', [ProductAddonController::class, 'destroy'])->whereNumber('id');

        // Store Customer Management
        Route::get('/customers/{customer_id}', [CustomerController::class, 'show'])->whereNumber('customer_id');
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::put('/customers/{customer_id}', [CustomerController::class, 'update'])->whereNumber('customer_id');
        Route::delete('/customers/{customer_id}', [CustomerController::class, 'destroy'])->whereNumber('customer_id');

        // Store Orders Manager
        Route::get('/orders/store/me', [OwnerOrderController::class, 'storeOrders']);
        Route::get('/orders/all', [OwnerOrderController::class, 'storeOrders']);
        Route::get('/orders/store', [OwnerOrderController::class, 'storeOrders']);
        Route::put('/orders/{order_id}/status', [OwnerOrderController::class, 'updateStatus'])->whereNumber('order_id');
        Route::put('/orders/{order_id}/payment-status', [OwnerOrderController::class, 'updatePaymentStatus'])->whereNumber('order_id');
        Route::get('/owner/orders', [OwnerOrderController::class, 'index']);
        Route::get('/owner/orders/mine', [OwnerOrderController::class, 'mine']);
        Route::get('/owner/orders/{id}', [OwnerOrderController::class, 'show'])->whereNumber('id');
        Route::put('/owner/orders/{id}/status', [OwnerOrderController::class, 'updateStatus'])->whereNumber('id');
        Route::put('/owner/orders/{id}/payment-status', [OwnerOrderController::class, 'updatePaymentStatus'])->whereNumber('id');

        // Stores Configuration
        Route::get('/stores/me', [StoreController::class, 'showMe']);
        Route::put('/stores/me', [StoreController::class, 'upsert']);
        Route::post('/stores/me', [StoreController::class, 'upsert']);
        Route::put('/stores/{store_id}', [StoreController::class, 'update'])->where('store_id', '^(?!me$)[a-zA-Z0-9]+$');
        Route::post('/stores/{store_id}', [StoreController::class, 'update'])->where('store_id', '^(?!me$)[a-zA-Z0-9]+$');
        Route::post('/stores/upload-logo', [StoreController::class, 'uploadLogo']);
        Route::post('/stores/upload-favicon', [StoreController::class, 'uploadFavicon']);
        Route::get('/stores/payment-gateways', [StoreController::class, 'getPaymentGateways']);

        // Store Domain Management
        Route::get('/stores/domains', [StoreController::class, 'listDomains']);
        Route::post('/stores/domains', [StoreController::class, 'addDomain']);
        Route::delete('/stores/domains/{id}', [StoreController::class, 'removeDomain'])->whereNumber('id');
        Route::post('/stores/subdomain', [StoreController::class, 'setSubdomain']);

        // CMS Configuration (Pages & Posts)
        Route::post('/pages', [CMSController::class, 'createPage']);
        Route::put('/pages/{page_id}', [CMSController::class, 'updatePage'])->whereNumber('page_id');
        Route::delete('/pages/{page_id}', [CMSController::class, 'deletePage'])->whereNumber('page_id');

        // No-Code Custom Page Builder (Owner)
        Route::get('/owner/pages-builder', [\App\Http\Controllers\Api\v1\Owner\PageController::class, 'index']);
        Route::post('/owner/pages-builder', [\App\Http\Controllers\Api\v1\Owner\PageController::class, 'store']);
        Route::delete('/owner/pages-builder/{id}', [\App\Http\Controllers\Api\v1\Owner\PageController::class, 'destroy'])->whereNumber('id');
        Route::post('/posts', [CMSController::class, 'createPost']);
        Route::put('/posts/{post_id}', [CMSController::class, 'updatePost'])->whereNumber('post_id');
        Route::delete('/posts/{post_id}', [CMSController::class, 'deletePost'])->whereNumber('post_id');

        // Social Media Links Setup
        Route::get('/social-media/mine', [SocialMediaController::class, 'mine']);
        Route::post('/social-media', [SocialMediaController::class, 'store']);
        Route::put('/social-media/{id}', [SocialMediaController::class, 'update']);
        Route::put('/social-media/{id}/toggle', [SocialMediaController::class, 'toggle']);
        Route::delete('/social-media/{id}', [SocialMediaController::class, 'destroy']);

        // Banners Configuration
        Route::get('/banners/mine', [BannerController::class, 'mine']);
        Route::post('/banners', [BannerController::class, 'store']);
        Route::put('/banners/{id}', [BannerController::class, 'update']);
        Route::post('/banners/{id}', [BannerController::class, 'update']);
        Route::put('/banners/{id}/toggle', [BannerController::class, 'toggle']);
        Route::delete('/banners/{id}', [BannerController::class, 'destroy']);

        // Coupons Configuration
        Route::get('/coupons/mine', [CouponController::class, 'mine']);
        Route::post('/coupons', [CouponController::class, 'store']);
        Route::put('/coupons/{id}', [CouponController::class, 'update'])->whereNumber('id');
        Route::post('/coupons/{id}', [CouponController::class, 'update'])->whereNumber('id');
        Route::put('/coupons/{id}/toggle', [CouponController::class, 'toggle'])->whereNumber('id');
        Route::delete('/coupons/{id}', [CouponController::class, 'destroy'])->whereNumber('id');

        // Flash Deals Configuration
        Route::get('/owner/flash-deals/mine', [FlashDealController::class, 'mine']);
        Route::post('/owner/flash-deals', [FlashDealController::class, 'store']);
        Route::put('/owner/flash-deals/{id}', [FlashDealController::class, 'update'])->whereNumber('id');
        Route::post('/owner/flash-deals/{id}', [FlashDealController::class, 'update'])->whereNumber('id');
        Route::put('/owner/flash-deals/{id}/toggle', [FlashDealController::class, 'toggle'])->whereNumber('id');
        Route::delete('/owner/flash-deals/{id}', [FlashDealController::class, 'destroy'])->whereNumber('id');
        Route::post('/owner/flash-deals/{id}/products', [FlashDealController::class, 'addProducts'])->whereNumber('id');
        Route::delete('/owner/flash-deals/{id}/products/{product_id}', [FlashDealController::class, 'removeProduct'])->whereNumber('id')->whereNumber('product_id');

        // Featured Deals Configuration
        Route::get('/owner/featured-deals/mine', [FeaturedDealController::class, 'mine']);
        Route::post('/owner/featured-deals', [FeaturedDealController::class, 'store']);
        Route::put('/owner/featured-deals/{id}', [FeaturedDealController::class, 'update'])->whereNumber('id');
        Route::post('/owner/featured-deals/{id}', [FeaturedDealController::class, 'update'])->whereNumber('id');
        Route::put('/owner/featured-deals/{id}/toggle', [FeaturedDealController::class, 'toggle'])->whereNumber('id');
        Route::delete('/owner/featured-deals/{id}', [FeaturedDealController::class, 'destroy'])->whereNumber('id');
        Route::post('/owner/featured-deals/{id}/products', [FeaturedDealController::class, 'addProducts'])->whereNumber('id');
        Route::delete('/owner/featured-deals/{id}/products/{product_id}', [FeaturedDealController::class, 'removeProduct'])->whereNumber('id')->whereNumber('product_id');

        // Clearance Sales Configuration
        Route::get('/owner/clearance-sales/mine', [ClearanceSaleController::class, 'mine']);
        Route::post('/owner/clearance-sales', [ClearanceSaleController::class, 'store']);
        Route::put('/owner/clearance-sales/{id}', [ClearanceSaleController::class, 'update'])->whereNumber('id');
        Route::post('/owner/clearance-sales/{id}', [ClearanceSaleController::class, 'update'])->whereNumber('id');
        Route::put('/owner/clearance-sales/{id}/toggle', [ClearanceSaleController::class, 'toggle'])->whereNumber('id');
        Route::delete('/owner/clearance-sales/{id}', [ClearanceSaleController::class, 'destroy'])->whereNumber('id');
        Route::post('/owner/clearance-sales/{id}/products', [ClearanceSaleController::class, 'addProducts'])->whereNumber('id');
        Route::put('/owner/clearance-sales/{id}/products/{product_id}', [ClearanceSaleController::class, 'updateProductPivot'])->whereNumber('id')->whereNumber('product_id');
        Route::delete('/owner/clearance-sales/{id}/products/{product_id}', [ClearanceSaleController::class, 'removeProduct'])->whereNumber('id')->whereNumber('product_id');

        // Delivery Methods Configuration
        Route::get('/owner/delivery-methods/mine', [DeliveryMethodController::class, 'mine']);
        Route::post('/owner/delivery-methods', [DeliveryMethodController::class, 'store']);
        Route::put('/owner/delivery-methods/{id}', [DeliveryMethodController::class, 'update'])->whereNumber('id');
        Route::post('/owner/delivery-methods/{id}', [DeliveryMethodController::class, 'update'])->whereNumber('id');
        Route::put('/owner/delivery-methods/{id}/toggle', [DeliveryMethodController::class, 'toggle'])->whereNumber('id');
        Route::delete('/owner/delivery-methods/{id}', [DeliveryMethodController::class, 'destroy'])->whereNumber('id');

        // Temporary Food Items Configuration
        Route::post('/items', [FoodItemController::class, 'store']);
        Route::put('/items/{item_id}', [FoodItemController::class, 'update'])->whereNumber('item_id');
        Route::delete('/items/{item_id}', [FoodItemController::class, 'destroy'])->whereNumber('item_id');

        Route::get('/customers', [CustomerController::class, 'index']);

        // Owner Bakong KHQR generator
        Route::post('/owner/khqr-bakong/generate',[KhqrBakongController::class, 'generateQr']);
        Route::post('/owner/khqr-bakong/check', [KhqrBakongController::class, 'checkTransaction']);
    });

    // ---------------------------------------------------------------------
    //   CUSTOMER & ADMIN ROUTES (Role 2 or 1)
    // ---------------------------------------------------------------------
    Route::middleware('customer')->group(function () {
        // User Profile
        Route::get('/users/me', [AuthController::class, 'me']);
        Route::put('/users/me', [AuthController::class, 'update']);
        Route::post('/users/me', [AuthController::class, 'update']);

        // Orders History
        Route::get('/orders/me', [OrderController::class, 'me']);
        Route::get('/orders/mine', [OrderController::class, 'mine']);
        Route::get('/orders/{order_id}', [OrderController::class, 'show'])->whereNumber('order_id');

        // Shipping Addresses
        Route::get('/shipping-addresses', [ShippingAddressController::class, 'index']);
        Route::post('/shipping-addresses', [ShippingAddressController::class, 'store']);
        Route::get('/shipping-addresses/{id}', [ShippingAddressController::class, 'show'])->whereNumber('id');
        Route::put('/shipping-addresses/{id}', [ShippingAddressController::class, 'update'])->whereNumber('id');
        Route::delete('/shipping-addresses/{id}', [ShippingAddressController::class, 'destroy'])->whereNumber('id');
        Route::put('/shipping-addresses/{id}/set-default', [ShippingAddressController::class, 'setDefault'])->whereNumber('id');

        // Product Ratings
        Route::post('/products/{id}/ratings', [ProductRatingController::class, 'store'])->whereNumber('id');

        // Product Like functionality
        Route::get('/products/liked', [LikeController::class, 'getMyLikedProductIds']);
        Route::post('/products/{id}/like', [LikeController::class, 'toggleProductLike'])->whereNumber('id');
        Route::get('/products/{id}/like-status', [LikeController::class, 'getProductLikeStatus'])->whereNumber('id');

        // Shopping Cart
        Route::get('/cart', [CartController::class, 'index']);
        Route::post('/cart', [CartController::class, 'store']);
        Route::put('/cart/{id}', [CartController::class, 'update'])->whereNumber('id');
        Route::delete('/cart/clear', [CartController::class, 'clear']);
        Route::delete('/cart/{id}', [CartController::class, 'destroy'])->whereNumber('id');
    });
});
