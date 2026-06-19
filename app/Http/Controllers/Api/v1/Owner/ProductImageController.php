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
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $product = Product::findOrFail($productId);

        $request->validate([
            'image' => 'nullable',
            'product_variant_id' => 'nullable|integer|exists:product_variants,id',
            'is_primary' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $imagePath = [];
        if ($request->hasFile('image')) {
            $files = $request->file('image');
            if (is_array($files)) {
                foreach ($files as $file) {
                    $imagePath[] = UploadHelper::uploadImage($file, 'products');
                }
            } else {
                $imagePath[] = UploadHelper::uploadImage($files, 'products');
            }
        }
        if (empty($imagePath)) {
            return response()->json(['detail' => 'No image file was provided.'], 400);
        }

        // If is_primary is true, make sure to reset other images' is_primary flag for this product
        if ($request->is_primary) {
            ProductImage::where('product_id', $product->id)->update(['is_primary' => false]);
        }

        $productImages = [];
        foreach ($imagePath as $index => $path) {
            $isPrimary = false;
            if ($index === 0) {
                if ($request->is_primary) {
                    $isPrimary = true;
                } elseif (ProductImage::where('product_id', $product->id)->where('is_primary', true)->count() === 0) {
                    $isPrimary = true;
                }
            }

            $productImages[] = ProductImage::create([
                'product_id' => $product->id,
                'product_variant_id' => $request->product_variant_id,
                'image' => $path,
                'is_primary' => $isPrimary,
                'sort_order' => ($request->sort_order ?? 0) + $index,
                'created_by' => $request->user()->id,
            ]);
        }

        return response()->json(count($productImages) === 1 ? $productImages[0] : $productImages, 201);
    }

    public function update(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $image = ProductImage::findOrFail($id);

        $request->validate([
            'is_primary' => 'sometimes|required|boolean',
            'sort_order' => 'sometimes|required|integer',
        ]);

        if ($request->has('is_primary')) {
            if ($request->is_primary) {
                ProductImage::where('product_id', $image->product_id)->update(['is_primary' => false]);
            }
            $image->is_primary = $request->is_primary;
        }

        if ($request->has('sort_order')) {
            $image->sort_order = $request->sort_order;
        }

        $image->save();

        return response()->json($image);
    }

    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $image = ProductImage::findOrFail($id);

        // Delete physical file from disk
        UploadHelper::deleteImage($image->getRawOriginal('image'));

        $image->delete();

        return response()->json(['detail' => 'Product image deleted successfully.']);
    }
}
