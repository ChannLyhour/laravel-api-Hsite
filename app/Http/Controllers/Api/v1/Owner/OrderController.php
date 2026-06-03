<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied. Store owner or admin only.'], 403);
        }

        $store = Store::where('created_by', $user->id)->first();
        if (! $store && $user->role_id != 1) {
            return response()->json(['detail' => 'You do not have a store profile configured yet.'], 404);
        }

        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);
        $status = $request->query('status');
        $paymentStatus = $request->query('payment_status');
        $orderType = $request->query('order_type');
        $search = $request->query('search');

        $query = Order::query()->with('items');

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
            $query->where('status', strtolower(trim($status)));
        }

        if ($paymentStatus && strtolower($paymentStatus) !== 'all') {
            $query->where('payment_status', strtolower(trim($paymentStatus)));
        }

        if ($orderType && strtolower($orderType) !== 'all') {
            $query->where('order_type', strtolower(trim($orderType)));
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('order_no', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        $orders = $query->orderBy('created_at', 'desc')
            ->skip($skip)
            ->take($limit)
            ->get();

        return response()->json($orders);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied. Store owner or admin only.'], 403);
        }

        $order = Order::with(['items', 'store'])->findOrFail($id);

        // Authorization check
        $isAdmin = $user->role_id == 1;
        $isOwner = $order->store && $order->store->created_by == $user->id;

        if (! ($isAdmin || $isOwner)) {
            return response()->json(['detail' => "You are not authorized to view this order."], 403);
        }

        return response()->json($order);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string',
        ]);

        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied. Store owner or admin only.'], 403);
        }

        $order = Order::with('store')->findOrFail($id);

        // Authorization check
        $isAdmin = $user->role_id == 1;
        $isOwner = $order->store && $order->store->created_by == $user->id;

        if (! ($isAdmin || $isOwner)) {
            return response()->json(['detail' => 'You are not authorized to manage orders for this store.'], 403);
        }

        $validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
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

        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied. Store owner or admin only.'], 403);
        }

        $order = Order::with('store')->findOrFail($id);

        // Authorization check
        $isAdmin = $user->role_id == 1;
        $isOwner = $order->store && $order->store->created_by == $user->id;

        if (! ($isAdmin || $isOwner)) {
            return response()->json(['detail' => 'You are not authorized to manage orders for this store.'], 403);
        }

        $validPaymentStatuses = ['paid', 'unpaid', 'refunded'];
        $newStatus = strtolower(trim($request->payment_status));

        if (! in_array($newStatus, $validPaymentStatuses)) {
            return response()->json(['detail' => "Invalid payment status '{$request->payment_status}'. Allowed values: " . implode(', ', $validPaymentStatuses)], 400);
        }

        $order->update(['payment_status' => $newStatus]);
        return response()->json($order);
    }
}
