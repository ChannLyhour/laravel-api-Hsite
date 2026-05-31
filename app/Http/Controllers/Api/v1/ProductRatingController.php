<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductRating;
use App\Models\Customer;
use Illuminate\Http\Request;

class ProductRatingController extends Controller
{
    public function index($productId)
    {
        $product = Product::findOrFail($productId);
        $ratings = $product->ratings()->with('customer')->orderBy('created_at', 'desc')->get();
        return response()->json($ratings);
    }

    public function store(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);
        $user = $request->user();

        // Ensure user has a customer profile
        $customer = Customer::where('user_id', $user->id)->first();
        if (! $customer) {
            return response()->json(['detail' => 'You must have a customer profile configured to submit ratings.'], 400);
        }

        $request->validate([
            'order_id' => 'required|integer|exists:orders,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        // Check if customer already rated this product for this order
        $exists = ProductRating::where('product_id', $product->id)
            ->where('customer_id', $customer->id)
            ->where('order_id', $request->order_id)
            ->exists();

        if ($exists) {
            return response()->json(['detail' => 'You have already submitted a rating for this product in this order.'], 400);
        }

        $rating = ProductRating::create([
            'product_id' => $product->id,
            'customer_id' => $customer->id,
            'order_id' => $request->order_id,
            'rating' => $request->rating,
            'comment' => $request->comment,
            'created_by' => $user->id,
        ]);

        $rating->load('customer');
        return response()->json($rating, 201);
    }
}
