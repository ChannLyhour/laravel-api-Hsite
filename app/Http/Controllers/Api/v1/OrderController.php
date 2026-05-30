<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
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
            'items.*.menu_item_id' => 'required|integer|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'payment_method' => 'required|string',
            'customer_name' => 'required|string',
            'customer_phone' => 'nullable|string',
            'customer_address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $store = Store::findOrFail($request->store_id);
        $user = $request->user();

        // 1. Resolve/create customer profile to satisfy DB
        $customer = null;
        if ($user) {
            $customer = Customer::where('user_id', $user->id)->first();
            if (! $customer) {
                $customer = Customer::create([
                    'user_id' => $user->id,
                    'name' => $request->customer_name,
                    'email' => $user->email,
                    'phone' => $request->customer_phone,
                    'address' => $request->customer_address,
                    'created_by' => $user->id,
                ]);
            }
        }

        $subtotal = 0.00;
        $orderItems = [];

        // 2. Process each item, verifying availability and snapshotting pricing
        foreach ($request->items as $itemData) {
            $menuItem = MenuItem::findOrFail($itemData['menu_item_id']);

            if ($menuItem->status !== 'available') {
                return response()->json(['detail' => "Menu item '{$menuItem->name}' is currently unavailable."], 400);
            }

            $price = (float) $menuItem->price;
            $qty = (int) $itemData['quantity'];
            $subtotal += $price * $qty;

            $orderItems[] = new OrderItem([
                'menu_item_id' => $menuItem->id,
                'name' => $menuItem->name,
                'quantity' => $qty,
                'price' => $price,
            ]);
        }

        // 3. Compute tax/VAT
        $taxPct = (float) ($store->tax_percentage ?? 0.0);
        $taxAmount = $subtotal * ($taxPct / 100.00);
        $totalAmount = $subtotal + $taxAmount;

        // 4. Generate order number
        $orderNo = 'ORD-' . strtoupper(Str::random(6));

        // 5. Create order
        $order = Order::create([
            'order_no' => $orderNo,
            'order_type' => 'dine_in', // default value
            'customer_id' => $customer ? $customer->id : null,
            'user_id' => $user ? $user->id : null,
            'notes' => $request->notes,
            'status' => 'pending',
            'subtotal' => $subtotal,
            'tax' => $taxAmount,
            'total_amount' => $totalAmount,
            'store_id' => $store->id,
            'payment_status' => 'Unpaid',
            'payment_method' => $request->payment_method,
            'customer_name' => $request->customer_name,
            'customer_phone' => $request->customer_phone,
            'customer_address' => $request->customer_address,
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
