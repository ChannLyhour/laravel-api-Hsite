<?php

namespace App\Http\Controllers\Api\v1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\Order;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role_id !== 1) {
            return response()->json(['detail' => 'Access denied. Only administrators are authorized.'], 403);
        }

        $stats = [
            'total_users' => User::count(),
            'total_customers' => Customer::count(),
            'total_stores' => Store::where('key', 'store_name')->count(),
            'total_products' => Product::count(),
            'total_orders' => Order::count(),
            'total_revenue' => Order::where('payment_status', 'Paid')->sum('total_amount'),
            'recent_orders' => Order::with(['items', 'store'])->latest()->take(5)->get(),
            'top_stores' => $this->getTopStores(),
            'order_status_distribution' => $this->getOrderStatusDistribution(),
        ];

        return response()->json($stats);
    }

    private function getTopStores()
    {
        return DB::table('orders')
            ->select('store_id', DB::raw('SUM(total_amount) as revenue'), DB::raw('COUNT(*) as total_orders'))
            ->where('payment_status', 'Paid')
            ->groupBy('store_id')
            ->orderBy('revenue', 'desc')
            ->take(5)
            ->get()
            ->map(function ($item) {
                $storeName = DB::table('stores')
                    ->where('created_by', function($query) use ($item) {
                        $query->select('created_by')->from('stores')->where('id', $item->store_id);
                    })
                    ->where('key', 'store_name')
                    ->value('value');
                
                $item->store_name = $storeName ?? 'Unknown Store';
                return $item;
            });
    }

    private function getOrderStatusDistribution()
    {
        return DB::table('orders')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();
    }
}
