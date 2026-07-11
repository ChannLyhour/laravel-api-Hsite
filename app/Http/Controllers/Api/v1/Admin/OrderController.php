<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role_id !== 1) {
            return response()->json(['detail' => 'Access denied.'], 403);
        }

        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);
        
        $query = Order::with(['items.productVariant.product', 'store', 'user']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            $query->where('status', '!=', 'unverified');
        }

        if ($request->has('store_id')) {
            $query->where('store_id', $request->store_id);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $orders = $query->latest()->skip($skip)->take($limit)->get();
        return response()->json($orders);
    }

    public function show($id)
    {
        $order = Order::with(['items.productVariant.product', 'store', 'user', 'payment'])->findOrFail($id);
        return response()->json($order);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|string']);
        $order = Order::findOrFail($id);
        
        $oldStatus = $order->status;
        $newStatus = strtolower(trim($request->status));
        $order->update(['status' => $request->status]);

        $activeStatuses = ['pending', 'processing', 'completed', 'complete', 'confirmed', 'delivering', 'shipped', 'out_for_delivery'];
        $wasActive = in_array(strtolower($oldStatus), $activeStatuses);
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
        } elseif ((strtolower($oldStatus) === 'cancelled' || strtolower($oldStatus) === 'canceled') && $isActiveNow) {
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

        \App\Helpers\SendStatusTelegramboToCustomers::sendStatus($order, $request->status);
        return response()->json($order);
    }
}
