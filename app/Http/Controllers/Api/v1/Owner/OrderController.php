<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index (Request $request)
    {
        $user = $request->user();
        if ($user->role_id !== 30003) {
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
        $customerId = $request->query('customer_id');
        $customerEmail = $request->query('customer_email');
        $customerPhone = $request->query('customer_phone');

        $query = Order::query()->with(['items.productVariant.product', 'store', 'shippingAddress']);

        // Owner logic: ensure they only see their own store orders
        $hasStore = Store::where('created_by', $user->id)->exists();

        if (!$hasStore) {
            return response()->json(['detail' => 'You do not have a store profile configured yet.'], 404);
        }

        if ($storeId) {
            if ((int) $storeId === $user->id) {
                $query->where('store_id', $user->id);
            } else {
                return response()->json(['detail' => 'You are not authorized to view orders for this store.'], 403);
            }
        } else {
            $query->where('store_id', $user->id);
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($customerId) {
            $customerRecord = \App\Models\Customer::find($customerId);
            if ($customerRecord) {
                $query->where(function ($q) use ($customerRecord) {
                    $hasCondition = false;
                    if ($customerRecord->user_id) {
                        $q->where('user_id', $customerRecord->user_id);
                        $hasCondition = true;
                    }
                    if ($customerRecord->email) {
                        if ($hasCondition) {
                            $q->orWhere('customer_email', $customerRecord->email);
                        } else {
                            $q->where('customer_email', $customerRecord->email);
                            $hasCondition = true;
                        }
                    }
                    if ($customerRecord->phone) {
                        if ($hasCondition) {
                            $q->orWhere('customer_phone', $customerRecord->phone);
                        } else {
                            $q->where('customer_phone', $customerRecord->phone);
                        }
                    }
                });
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        if ($customerEmail) {
            $query->where('customer_email', $customerEmail);
        }

        if ($customerPhone) {
            $query->where('customer_phone', $customerPhone);
        }

        if ($status && strtolower($status) !== 'all') {
            $query->where('status', strtolower(trim($status)));
        } else {
            $query->where('status', '!=', 'unverified');
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

    public function mine (Request $request)
    {
        return $this->index($request);
    }

    public function storeOrders (Request $request)
    {
        return $this->index($request);
    }

    public function show (Request $request, $id)
    {
        $user = $request->user();
        if ($user->role_id !== 30003) {
            return response()->json(['detail' => 'Access denied. Store owner only.'], 403);
        }

        $order = Order::with(['items.productVariant.product', 'store'])->findOrFail($id);

        // Authorization check
        $isOwner = (int) $order->store_id === $user->id;

        if (!$isOwner) {
            return response()->json(['detail' => "You are not authorized to view this order."], 403);
        }

        return response()->json($order);
    }

    public function updateStatus (Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string',
        ]);

        $user = $request->user();
        if ($user->role_id !== 30003) {
            return response()->json(['detail' => 'Access denied. Store owner only.'], 403);
        }

        $order = Order::findOrFail($id);

        // Authorization check
        $isOwner = (int) $order->store_id === $user->id;

        if (!$isOwner) {
            return response()->json(['detail' => 'You are not authorized to manage orders for this store.'], 403);
        }

        $validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'complete', 'canceled', 'confirmed', 'delivering', 'shipped', 'out_for_delivery'];
        $newStatus = strtolower(trim($request->status));

        if (!in_array($newStatus, $validStatuses)) {
            return response()->json(['detail' => "Invalid status '{$request->status}'. Allowed statuses: " . implode(', ', $validStatuses)], 400);
        }

        // Normalize to standard DB values expected by owner interface
        if ($newStatus === 'complete' || $newStatus === 'completed') {
            $newStatus = 'completed';
        } elseif ($newStatus === 'canceled' || $newStatus === 'cancelled') {
            $newStatus = 'cancelled';
        } elseif ($newStatus === 'confirmed') {
            $newStatus = 'confirmed';
        } elseif ($newStatus === 'delivering' || $newStatus === 'shipped' || $newStatus === 'out_for_delivery') {
            $newStatus = 'delivering';
        }

        $oldStatus = $order->status;
        $order->update(['status' => $newStatus]);

        $activeStatuses = ['pending', 'processing', 'completed', 'confirmed', 'delivering'];
        $wasActive = in_array($oldStatus, $activeStatuses);
        $isActiveNow = in_array($newStatus, $activeStatuses);

        if ($wasActive && ($newStatus === 'cancelled' || $newStatus === 'canceled')) {
            // Revert stock (increment)
            foreach ($order->items as $item) {
                if ($item->product_variant_id) {
                    $variant = \App\Models\ProductVariant::find($item->product_variant_id);
                    if ($variant) {
                        $variant->increment('stock_qty', $item->quantity);
                    }
                }
            }
        } elseif (($oldStatus === 'cancelled' || $oldStatus === 'canceled') && $isActiveNow) {
            // Deduct stock again (decrement)
            foreach ($order->items as $item) {
                if ($item->product_variant_id) {
                    $variant = \App\Models\ProductVariant::find($item->product_variant_id);
                    if ($variant) {
                        $variant->decrement('stock_qty', $item->quantity);
                    }
                }
            }
        }

        \App\Helpers\SendStatusTelegramboToCustomers::sendStatus($order, $newStatus);
        return response()->json($order);
    }

    public function updatePaymentStatus (Request $request, $id)
    {
        $request->validate([
            'payment_status' => 'required|string',
        ]);

        $user = $request->user();
        if ($user->role_id !== 30003) {
            return response()->json(['detail' => 'Access denied. Store owner only.'], 403);
        }

        $order = Order::findOrFail($id);

        // Authorization check
        $isOwner = (int) $order->store_id === $user->id;

        if (!$isOwner) {
            return response()->json(['detail' => 'You are not authorized to manage orders for this store.'], 403);
        }

        $validPaymentStatuses = ['paid', 'unpaid', 'refunded'];
        $newStatus = strtolower(trim($request->payment_status));

        if (!in_array($newStatus, $validPaymentStatuses)) {
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
