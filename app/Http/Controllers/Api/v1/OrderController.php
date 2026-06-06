<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\Product;
use App\Models\Store;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'store_id' => 'required|integer|exists:stores,id',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required_without:items.*.menu_item_id|nullable|integer|exists:product_variants,id',
            'items.*.menu_item_id' => 'required_without:items.*.product_variant_id|nullable|integer|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'payment_method' => 'required|string',
            'shipping_address_id' => 'nullable|integer|exists:shipping_addresses,id',
            'customer_name' => 'required_without:shipping_address_id|nullable|string',
            'customer_first_name' => 'nullable|string',
            'customer_last_name' => 'nullable|string',
            'customer_gender' => 'nullable|string|in:male,female',
            'customer_country' => 'nullable|string',
            'customer_phone' => 'nullable|string',
            'customer_email' => 'nullable|email',
            'customer_address' => 'nullable|string',
            'notes' => 'nullable|string',
            'order_type' => 'nullable|string|in:delivery,pickup,shipping',
            'shipping_fee' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
        ]);

        $store = Store::findOrFail($request->store_id);
        
        // Optional user detection for public route
        $user = auth('sanctum')->user();

        // 0. Guest Checkout Permission Check
        if (!$user && !$store->guest_checkout) {
            return response()->json(['detail' => 'Authentication required. This store does not allow guest checkout.'], 403);
        }

        // 1. Resolve shipping info
        $customerName = $request->customer_name;
        $customerPhone = $request->customer_phone;
        $customerEmail = $request->customer_email;
        $customerAddressStr = $request->customer_address;
        $customerCountry = $request->customer_country;
        $customerFirstName = $request->customer_first_name;
        $customerLastName = $request->customer_last_name;
        $shippingAddressId = $request->shipping_address_id;

        if ($user && !$customerEmail) {
            $customerEmail = $user->email;
        }

        if ($shippingAddressId) {
            $shippingAddress = \App\Models\ShippingAddress::findOrFail($shippingAddressId);
            $customerFirstName = $shippingAddress->first_name;
            $customerLastName = $shippingAddress->last_name;
            $customerName = $customerFirstName . ' ' . $customerLastName;
            $customerPhone = $shippingAddress->telephone;
            $customerAddressStr = $shippingAddress->address . ', ' . $shippingAddress->city_province;
            $customerCountry = $shippingAddress->country;
        }

        // 2. Resolve/create customer profile to satisfy DB
        $customer = null;
        if ($user) {
            $customer = Customer::where('user_id', $user->id)->first();
            if (! $customer) {
                $customer = Customer::create([
                    'user_id' => $user->id,
                    'name' => $customerName,
                    'first_name' => $customerFirstName,
                    'last_name' => $customerLastName,
                    'gender' => $request->customer_gender,
                    'country' => $customerCountry,
                    'email' => $customerEmail,
                    'phone' => $customerPhone,
                    'address' => $customerAddressStr,
                    'created_by' => $user->id,
                ]);
            }
        }

        $subtotal = 0.00;
        $orderItems = [];

        // 3. Process each item, verifying availability and snapshotting pricing
        foreach ($request->items as $itemData) {
            $variantId = $itemData['product_variant_id'] ?? $itemData['menu_item_id'];
            $variant = ProductVariant::with('product.translations')->findOrFail($variantId);
            $product = $variant->product;

            if ($product->status !== 'active') {
                return response()->json(['detail' => "Product '{$product->name}' is currently unavailable."], 400);
            }

            $qty = (int) $itemData['quantity'];
            if ($variant->stock_qty < $qty) {
                return response()->json(['detail' => "Insufficient stock for '{$product->name}' (Requested: {$qty}, Available: {$variant->stock_qty})."], 400);
            }

            $price = (float) $variant->retail_price;
            $subtotal += $price * $qty;

            // Deduct stock
            $variant->decrement('stock_qty', $qty);

            $orderItems[] = new OrderItem([
                'product_variant_id' => $variant->id,
                'name' => $product->name . ($variant->variant_sku ? " ({$variant->variant_sku})" : ""),
                'quantity' => $qty,
                'price' => $price,
            ]);
        }

        // 4. Compute tax/VAT
        $taxPct = (float) ($store->tax_percentage ?? 0.0);
        $taxAmount = $subtotal * ($taxPct / 100.00);
        $totalAmount = $subtotal + $taxAmount;

        // 5. Generate order number
        $orderNo = 'ORD-' . strtoupper(Str::random(6));

        $shippingFee = (float)$request->input('shipping_fee', 0.00);
        $discountAmount = (float)$request->input('discount_amount', 0.00);
        $finalTotal = $totalAmount + $shippingFee - $discountAmount;

        // 6. Create order
        $order = Order::create([
            'order_no' => $orderNo,
            'order_type' => $request->input('order_type', \App\Enums\OrderType::Delivery->value),
            'user_id' => $user ? $user->id : null,
            'shipping_address_id' => $shippingAddressId,
            'notes' => $request->notes,
            'status' => 'pending',
            'subtotal' => $subtotal,
            'tax' => $taxAmount,
            'shipping_fee' => $shippingFee,
            'discount_amount' => $discountAmount,
            'total_amount' => max(0.00, $finalTotal),
            'store_id' => $store->id,
            'payment_status' => 'Unpaid',
            'payment_method' => $request->payment_method,
            'customer_name' => $customerName,
            'customer_phone' => $customerPhone,
            'customer_email' => $customerEmail,
            'customer_address' => $customerAddressStr,
        ]);

        $order->items()->saveMany($orderItems);

        // Load items relation for response
        $order->load('items');

        return response()->json($order, 201);
    }

    public function me(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $orders = Order::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->skip($skip)
            ->take($limit)
            ->with('items')
            ->get();

        return response()->json($orders);
    }

    public function storeOrders(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied. Store owner or admin only.'], 403);
        }

        $store = Store::where('created_by', $user->id)->first();
        if (! $store && $user->role_id != 1) {
            return response()->json(['detail' => 'You do not have a store profile configured yet.'], 404);
        }

        $status = $request->query('status');
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $query = Order::query();
        if ($user->role_id != 1) {
            $query->where('store_id', $store->id);
        } else {
            $createdBy = $request->query('created_by');
            if ($createdBy !== null) {
                $ownerStore = Store::where('created_by', $createdBy)->first();
                if ($ownerStore) {
                    $query->where('store_id', $ownerStore->id);
                } else {
                    $query->where('store_id', -1);
                }
            }
        }
        if ($status && strtolower($status) !== 'all') {
            $query->where('status', strtolower($status));
        }

        $orders = $query->orderBy('created_at', 'desc')
            ->skip($skip)
            ->take($limit)
            ->with('items')
            ->get();

        return response()->json($orders);
    }

    public function show(Request $request, $id)
    {
        $order = Order::with(['items', 'store'])->findOrFail($id);
        $user = $request->user();

        // Auths checks
        $isAdmin = $user->role_id == 1;
        $isPurchaser = $order->user_id == $user->id;
        $isOwner = $order->store && $order->store->created_by == $user->id;

        if (! ($isAdmin || $isPurchaser || $isOwner)) {
            return response()->json(['detail' => "You are not authorized to view this order's invoice details."], 403);
        }

        return response()->json($order);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string',
        ]);

        $order = Order::with('store')->findOrFail($id);
        $user = $request->user();

        // Auths checks
        $isAdmin = $user->role_id == 1;
        $isOwner = $order->store && $order->store->created_by == $user->id;

        if (! ($isAdmin || $isOwner)) {
            return response()->json(['detail' => 'You are not authorized to manage orders for this store.'], 403);
        }

        $validStatuses = ['pending', 'confirmed', 'canceled', 'complete'];
        $newStatus = strtolower(trim($request->status));

        if (! in_array($newStatus, $validStatuses)) {
            return response()->json(['detail' => "Invalid status '{$request->status}'. Allowed statuses: " . implode(', ', $validStatuses)], 400);
        }

        $order->update(['status' => $newStatus]);
        return response()->json($order);
    }

    public function updatePaymentStatus(Request $request, $id)
    {
        $request->validate([
            'payment_status' => 'required|string',
        ]);

        $order = Order::with('store')->findOrFail($id);
        $user = $request->user();

        // Auths checks
        $isAdmin = $user->role_id == 1;
        $isOwner = $order->store && $order->store->created_by == $user->id;

        if (! ($isAdmin || $isOwner)) {
            return response()->json(['detail' => 'You are not authorized to manage orders for this store.'], 403);
        }

        $validPaymentStatuses = ['Paid', 'Unpaid'];
        $newStatus = trim($request->payment_status);

        // Case-insensitive fallback
        if (strtolower($newStatus) === 'paid') {
            $newStatus = 'Paid';
        } elseif (strtolower($newStatus) === 'unpaid') {
            $newStatus = 'Unpaid';
        }

        if (! in_array($newStatus, $validPaymentStatuses)) {
            return response()->json(['detail' => "Invalid payment status '{$request->payment_status}'. Allowed values: Paid, Unpaid"], 400);
        }

        $order->update(['payment_status' => $newStatus]);
        return response()->json($order);
    }
}
