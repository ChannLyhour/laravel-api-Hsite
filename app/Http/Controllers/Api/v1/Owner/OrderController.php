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
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Access denied.'], 403);
        }

        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);
        $status = $request->query('status');
        $paymentStatus = $request->query('payment_status');
        $orderType = $request->query('order_type');
        $search = $request->query('search');
        $storeId = $request->query('store_id');
        $userId = $request->query('user_id');
        $ownerId = $request->query('owner_id') ?? $request->query('vendor_id') ?? $request->query('created_by');

        $query = Order::query()->with(['items.productVariant.product', 'store']);

        if ($user->role_id == 30003) {
            // Owner logic: ensure they only see their own stores
            $myStoreIds = Store::where('created_by', $user->id)->pluck('id')->toArray();

            if (empty($myStoreIds)) {
                return response()->json(['detail' => 'You do not have a store profile configured yet.'], 404);
            }

            if ($storeId) {
                // Use loose comparison or cast to handle string/int mismatch
                if (in_array((int)$storeId, $myStoreIds)) {
                    $query->where('store_id', $storeId);
                } else {
                    return response()->json(['detail' => 'You are not authorized to view orders for this store.'], 403);
                }
            } else {
                $query->whereIn('store_id', $myStoreIds);
            }
        } elseif ($user->role_id == 2) {
            // Customer logic: only see their own orders
            $query->where('user_id', $user->id);
            if ($storeId) {
                $query->where('store_id', $storeId);
            }
        } else {
            // Admin logic (role 1): can filter by store_id or owner_id or user_id or see all
            if ($storeId) {
                $query->where('store_id', $storeId);
            }

            if ($ownerId !== null) {
                $ownerStoreIds = Store::where('created_by', $ownerId)->pluck('id')->toArray();
                if (!empty($ownerStoreIds)) {
                    $query->whereIn('store_id', $ownerStoreIds);
                } else {
                    $query->where('store_id', -1); // Force empty result if owner has no stores
                }
            }
        }

        if ($userId && $user->role_id != 2) {
            $query->where('user_id', $userId);
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

        $orders = $query->orderBy('id', 'desc')
            ->skip($skip)
            ->take($limit)
            ->get();

        return response()->json($orders);
    }

    public function mine(Request $request)
    {
        return $this->index($request);
    }

    public function storeOrders(Request $request)
    {
        return $this->index($request);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied. Store owner or admin only.'], 403);
        }

        $order = Order::with(['items.productVariant.product', 'store'])->findOrFail($id);

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

        $validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'complete', 'canceled', 'confirmed'];
        $newStatus = strtolower(trim($request->status));

        if (! in_array($newStatus, $validStatuses)) {
            return response()->json(['detail' => "Invalid status '{$request->status}'. Allowed statuses: " . implode(', ', $validStatuses)], 400);
        }

        // Normalize to standard DB values expected by owner interface
        if ($newStatus === 'complete' || $newStatus === 'completed') {
            $newStatus = 'completed';
        } elseif ($newStatus === 'canceled' || $newStatus === 'cancelled') {
            $newStatus = 'cancelled';
        } elseif ($newStatus === 'confirmed') {
            $newStatus = 'confirmed';
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

        // Normalize to Capitalized to be consistent with database defaults and other controllers
        if ($newStatus === 'paid') {
            $newStatus = 'Paid';
        } elseif ($newStatus === 'unpaid') {
            $newStatus = 'Unpaid';
        } elseif ($newStatus === 'refunded') {
            $newStatus = 'Refunded';
        }

        $order->update(['payment_status' => $newStatus]);
        return response()->json($order);
    }
}
