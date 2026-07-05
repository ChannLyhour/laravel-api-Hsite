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
        $order->update(['status' => $request->status]);
        \App\Helpers\SendStatusTelegramboToCustomers::sendStatus($order, $request->status);
        return response()->json($order);
    }
}
