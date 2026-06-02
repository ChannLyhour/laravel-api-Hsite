<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductVariantController extends Controller
{
    public function index($productId)
    {
        $product = Product::findOrFail($productId);
        $variants = $product->variants()->with('attributeValues.attribute')->get();
        return response()->json($variants);
    }

    public function store(Request $request, $productId)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $product = Product::findOrFail($productId);

        $request->validate([
            'variant_sku' => 'required|string|max:100|unique:product_variants,variant_sku',
            'region_code' => 'nullable|string|max:3',
            'currency_code' => 'nullable|string|max:3',
            'purchase_price' => 'required|numeric|min:0',
            'retail_price' => 'required|numeric|min:0',
            'compare_at_price' => 'nullable|numeric|min:0',
            'stock_qty' => 'required|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'attribute_values' => 'nullable|array', // array of ProductAttributeValue IDs
            'attribute_values.*' => 'integer|exists:product_attribute_values,id',
        ]);

        return DB::transaction(function () use ($request, $product) {
            $variant = ProductVariant::create([
                'product_id' => $product->id,
                'variant_sku' => $request->variant_sku,
                'region_code' => $request->region_code ?? 'GLO',
                'currency_code' => $request->currency_code ?? 'USD',
                'purchase_price' => $request->purchase_price,
                'retail_price' => $request->retail_price,
                'compare_at_price' => $request->compare_at_price,
                'stock_qty' => $request->stock_qty,
                'low_stock_threshold' => $request->low_stock_threshold ?? 5,
                'created_by' => $request->user()->id,
            ]);

            if ($request->has('attribute_values')) {
                $variant->attributeValues()->sync($request->attribute_values);
            }

            $variant->load('attributeValues.attribute');
            return response()->json($variant, 201);
        });
    }

    public function update(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $variant = ProductVariant::findOrFail($id);

        $request->validate([
            'variant_sku' => 'sometimes|required|string|max:100|unique:product_variants,variant_sku,' . $variant->id,
            'region_code' => 'sometimes|required|string|max:3',
            'currency_code' => 'sometimes|required|string|max:3',
            'purchase_price' => 'sometimes|required|numeric|min:0',
            'retail_price' => 'sometimes|required|numeric|min:0',
            'compare_at_price' => 'nullable|numeric|min:0',
            'stock_qty' => 'sometimes|required|integer|min:0',
            'low_stock_threshold' => 'sometimes|required|integer|min:0',
            'attribute_values' => 'nullable|array',
            'attribute_values.*' => 'integer|exists:product_attribute_values,id',
        ]);

        return DB::transaction(function () use ($request, $variant) {
            $variant->update($request->only([
                'variant_sku',
                'region_code',
                'currency_code',
                'purchase_price',
                'retail_price',
                'compare_at_price',
                'stock_qty',
                'low_stock_threshold',
            ]));

            if ($request->has('attribute_values')) {
                $variant->attributeValues()->sync($request->attribute_values);
            }

            $variant->load('attributeValues.attribute');
            return response()->json($variant);
        });
    }

    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $variant = ProductVariant::findOrFail($id);
        $variant->delete();

        return response()->json(['detail' => 'Product variant deleted successfully.']);
    }
}
