<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use App\Helpers\UploadHelper;

class ProductImageController extends Controller
{
    public function store(Request $request, $productId)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $product = Product::findOrFail($productId);

        $request->validate([
            'image' => 'nullable',
            'image_url' => 'nullable|string',
            'product_variant_id' => 'nullable|integer|exists:product_variants,id',
            'is_primary' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = UploadHelper::uploadImage($request->file('image'), 'products');
        } elseif ($request->has('image') && is_string($request->image)) {
            $imagePath = $request->image;
        } elseif ($request->has('image_url')) {
            $imagePath = $request->image_url;
        }

        if (! $imagePath) {
            return response()->json(['detail' => 'No image file or URL was provided.'], 400);
        }

        // Clean domain URL prefix if present
        if ($imagePath && (str_starts_with($imagePath, 'http://') || str_starts_with($imagePath, 'https://'))) {
            $baseUrl = url('/');
            if (str_starts_with($imagePath, $baseUrl)) {
                $imagePath = ltrim(substr($imagePath, strlen($baseUrl)), '/');
            }
        }

        // If is_primary is true, make sure to reset other images' is_primary flag for this product
        if ($request->is_primary) {
            ProductImage::where('product_id', $product->id)->update(['is_primary' => false]);
        }

        $productImage = ProductImage::create([
            'product_id' => $product->id,
            'product_variant_id' => $request->product_variant_id,
            'image_path' => $imagePath,
            'is_primary' => $request->is_primary ?? false,
            'sort_order' => $request->sort_order ?? 0,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($productImage, 201);
    }

    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $image = ProductImage::findOrFail($id);

        // Delete physical file from disk
        UploadHelper::deleteImage($image->getRawOriginal('image_path'));

        $image->delete();

        return response()->json(['detail' => 'Product image deleted successfully.']);
    }
}
