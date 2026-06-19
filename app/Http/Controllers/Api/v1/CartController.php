<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /**
     * Display a listing of the cart items for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $cartItems = Cart::where('user_id', $user->id)
            ->with(['product', 'product.addons', 'variant', 'owner'])
            ->get();

        return response()->json($cartItems);
    }

    /**
     * Store a newly created cart item (Add to Cart).
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'nullable|integer|min:1',
        ]);

        $user = $request->user();
        $product = Product::findOrFail($request->product_id);

        // Check if item already exists in cart
        $cartItem = Cart::where('user_id', $user->id)
            ->where('product_id', $request->product_id)
            ->where('product_variant_id', $request->product_variant_id)
            ->first();

        if ($cartItem) {
            $cartItem->quantity += ($request->quantity ?? 1);
            $cartItem->save();
        } else {
            $cartItem = Cart::create([
                'user_id' => $user->id,
                'product_id' => $request->product_id,
                'product_variant_id' => $request->product_variant_id,
                'quantity' => $request->quantity ?? 1,
                'created_by' => $product->created_by, // Saving the Owner/Creator of the product
            ]);
        }

        return response()->json($cartItem->load(['product', 'variant']), 201);
    }

    /**
     * Update the specified cart item quantity.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $cartItem = Cart::where('user_id', $request->user()->id)->findOrFail($id);
        $cartItem->update(['quantity' => $request->quantity]);

        return response()->json($cartItem);
    }

    /**
     * Remove the specified cart item from storage.
     */
    public function destroy(Request $request, $id)
    {
        $cartItem = Cart::where('user_id', $request->user()->id)->findOrFail($id);
        $cartItem->delete();

        return response()->json(['message' => 'Item removed from cart.']);
    }

    /**
     * Clear the authenticated user's cart.
     */
    public function clear(Request $request)
    {
        Cart::where('user_id', $request->user()->id)->delete();
        return response()->json(['message' => 'Cart cleared.']);
    }
}
