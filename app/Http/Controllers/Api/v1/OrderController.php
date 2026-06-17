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
            'customer_name' => 'nullable|string',
            'customer_phone' => 'nullable|string',
            'items' => 'required|array',
            'store_id' => 'required|exists:stores,id',
            'total_amount' => 'required|numeric',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                // Try to get user from sanctum guard even if middleware is not applied to support both guest and auth
                $user = $request->user() ?? auth('sanctum')->user();
                $userId = $user ? $user->id : ($request->user_id ?? null);

                if ($request->coupon_code) {
                    $coupon = \App\Models\Coupon::where('code', strtoupper($request->coupon_code))
                        ->where('is_active', true)
                        ->first();

                    if (!$coupon) {
                        throw new \Exception('Invalid or inactive coupon code.');
                    }

                    $today = now()->toDateString();
                    if ($coupon->start_date->toDateString() > $today) {
                        throw new \Exception('Coupon is not yet active.');
                    }
                    if ($coupon->expire_date->toDateString() < $today) {
                        throw new \Exception('Coupon has expired.');
                    }

                    $subtotalVal = $request->subtotal ?? $request->total_amount;
                    if ($coupon->minimum_purchase && $subtotalVal < $coupon->minimum_purchase) {
                        throw new \Exception('Minimum purchase of $' . number_format($coupon->minimum_purchase, 2) . ' is required.');
                    }

                    if ($coupon->limit_total && $coupon->total_used >= $coupon->limit_total) {
                        throw new \Exception('This coupon has reached its total usage limit.');
                    }

                    if ($coupon->limit_same_user) {
                        $phone = $request->customer_phone;
                        $query = Order::where('coupon_code', $coupon->code)
                            ->where('status', '!=', 'canceled');

                        if ($userId) {
                            $query->where(function ($q) use ($userId, $phone) {
                                $q->where('user_id', $userId);
                                if ($phone) {
                                    $q->orWhere('customer_phone', $phone);
                                }
                            });
                        } else if ($phone) {
                            $query->where('customer_phone', $phone);
                        }

                        $usedCount = $query->count();
                        if ($usedCount >= $coupon->limit_same_user) {
                            throw new \Exception('You have reached the usage limit for this coupon.');
                        }
                    }

                    $coupon->increment('total_used');
                }

                $order = Order::create([
                    'order_no' =>strtoupper(Str::random(8)),
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
            $query->where('store_id', $user->id);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    /**
     * Delete/cancel order if checkout was abandoned or payment failed.
     */
    public function destroy($id)
    {
        try {
            return DB::transaction(function () use ($id) {
                $order = Order::findOrFail($id);
                
                // Revert coupon usage if applied
                if ($order->coupon_code) {
                    $coupon = \App\Models\Coupon::where('code', strtoupper($order->coupon_code))->first();
                    if ($coupon && $coupon->total_used > 0) {
                        $coupon->decrement('total_used');
                    }
                }
                
                // Set status to canceled and payment status to Failed
                $order->update([
                    'status' => 'canceled',
                    'payment_status' => 'Failed',
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Order canceled successfully'
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete order: ' . $e->getMessage()
            ], 500);
        }
    }
}
