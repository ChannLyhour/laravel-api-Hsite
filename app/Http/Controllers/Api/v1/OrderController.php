<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * Create a new order.
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string',
            'customer_phone' => 'required|string',
            'items' => 'required|array',
            'store_id' => 'required|exists:stores,id',
            'total_amount' => 'required|numeric',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                // Try to get user from sanctum guard even if middleware is not applied to support both guest and auth
                $user = $request->user() ?? auth('sanctum')->user();
                $userId = $user ? $user->id : ($request->user_id ?? null);

                $order = Order::create([
                    'order_no' => 'ORD-' . strtoupper(Str::random(8)),
                    'order_type' => $request->order_type ?? 'delivery',
                    'user_id' => $userId,
                    'created_by' => $userId,
                    'customer_name' => $request->customer_name,
                    'customer_phone' => $request->customer_phone,
                    'customer_email' => $request->customer_email,
                    'customer_address' => $request->customer_address,
                    'shipping_address_id' => $request->shipping_address_id,
                    'notes' => $request->notes,
                    'status' => 'pending',
                    'subtotal' => $request->subtotal ?? $request->total_amount,
                    'tax' => $request->tax ?? 0,
                    'shipping_fee' => $request->shipping_fee ?? 0,
                    'discount_amount' => $request->discount_amount ?? 0,
                    'coupon_code' => $request->coupon_code,
                    'total_amount' => $request->total_amount,
                    'payment_status' => 'Unpaid',
                    'payment_method' => $request->payment_method ?? 'cod',
                    'store_id' => $request->store_id,
                ]);

                if ($request->coupon_code) {
                    $coupon = \App\Models\Coupon::where('code', strtoupper($request->coupon_code))->first();
                    if ($coupon) {
                        $coupon->increment('total_used');
                    }
                }

                foreach ($request->items as $item) {
                    // Smart fallback for frontend sending different keys
                    $variantId = $item['product_variant_id'] ?? null;

                    if (!$variantId) {
                        // If frontend sends 'product_id' or 'menu_item_id', try to find the first variant of that product
                        $productId = $item['product_id'] ?? $item['menu_item_id'] ?? $item['id'] ?? null;
                        if ($productId) {
                            $variant = \App\Models\ProductVariant::where('product_id', $productId)->first();
                            if ($variant) {
                                $variantId = $variant->id;
                            } else {
                                // If it was actually a variant ID passed as product_id
                                $directVariant = \App\Models\ProductVariant::find($productId);
                                if ($directVariant) {
                                    $variantId = $directVariant->id;
                                }
                            }
                        }
                    }

                    // Resolve actual product name from database
                    $productName = $item['name'] ?? null;
                    if (!$productName || $productName === 'Product Item') {
                        if ($variantId) {
                            $resolvedVariant = \App\Models\ProductVariant::with('product')->find($variantId);
                            if ($resolvedVariant && $resolvedVariant->product) {
                                $productName = $resolvedVariant->product->name;
                            }
                        }
                    }

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_variant_id' => $variantId,
                        'name' => $productName ?? 'Unknown Product',
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Order created successfully',
                    'order' => $order->load(['items.productVariant.product', 'store'])
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get orders for the currently authenticated user.
     */
    public function me(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $query = Order::where('user_id', $user->id)
            ->with(['items.productVariant.product', 'store']);

        if ($request->has('store_id')) {
            $query->where('store_id', $request->store_id);
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        return response()->json($orders);
    }

    /**
     * Alias for me()
     */
    public function mine(Request $request)
    {
        return $this->me($request);
    }

    /**
     * Get details of a specific order.
     */
    public function show(Request $request, $id)
    {
        $order = Order::with(['items.productVariant.product', 'store'])->findOrFail($id);
        $user = $request->user();

        // Auths checks
        $isAdmin = $user && $user->role_id == 1;
        $isPurchaser = $user && $order->user_id == $user->id;
        $isOwner = $user && $order->store && $order->store->created_by == $user->id;

        // Allow access if admin, purchaser, store owner, or if it's a guest order being viewed (though guest view might need more security)
        if (!($isAdmin || $isPurchaser || $isOwner || ($order->user_id === null && $request->has('guest_access')))) {
            return response()->json(['message' => "You are not authorized to view this order."], 403);
        }

        return response()->json($order);
    }

    /**
     * Get orders for a specific store (for owners/admins).
     */
    public function storeOrders(Request $request)
    {
        $user = $request->user();
        if (!$user || !in_array((int)$user->role_id, [1, 30003])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Order::with(['items', 'store']);

        if ((int)$user->role_id !== 1) {
            $store = Store::where('created_by', $user->id)->first();
            if (!$store) {
                return response()->json([]);
            }
            $query->where('store_id', $store->id);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }
}
