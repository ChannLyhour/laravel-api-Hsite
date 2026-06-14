<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductAddon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductAddonController extends Controller
{
    public function index($productId)
    {
        $product = Product::findOrFail($productId);
        $addons = $product->addons;
        return response()->json($addons);
    }

    public function store(Request $request, $productId)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $product = Product::findOrFail($productId);

        $request->validate([
            'addon_name' => 'required|string|max:255',
            'additional_price' => 'required|numeric|min:0',
        ]);

        $addon = ProductAddon::create([
            'product_id' => $product->id,
            'addon_name' => $request->addon_name,
            'additional_price' => $request->additional_price,
        ]);

        return response()->json($addon, 201);
    }

    public function update(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $addon = ProductAddon::findOrFail($id);

        $request->validate([
            'addon_name' => 'sometimes|required|string|max:255',
            'additional_price' => 'sometimes|required|numeric|min:0',
        ]);

        $addon->update($request->only([
            'addon_name',
            'additional_price',
        ]));

        return response()->json($addon);
    }

    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $addon = ProductAddon::findOrFail($id);
        $addon->delete();

        return response()->json(['detail' => 'Product addon deleted successfully.']);
    }
}
