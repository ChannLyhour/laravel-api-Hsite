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
            'image_url' => 'nullable',
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
        } elseif ($request->has('image') && is_array($request->image)) {
            $imagePath = $request->image;
        } elseif ($request->has('image') && is_string($request->image)) {
            if (str_starts_with($request->image, '[') || str_starts_with($request->image, '{')) {
                $decoded = json_decode($request->image, true);
                $imagePath = is_array($decoded) ? $decoded : [$request->image];
            } else {
                $imagePath = [$request->image];
            }
        } elseif ($request->has('image_url')) {
            if (is_array($request->image_url)) {
                $imagePath = $request->image_url;
            } else {
                $imagePath = [$request->image_url];
            }
        }

        if (empty($imagePath)) {
            return response()->json(['detail' => 'No image file or URL was provided.'], 400);
        }

        // Clean domain URL prefix if present
        $imagePath = array_map(function ($path) {
            if ($path && (str_starts_with($path, 'http://') || str_starts_with($path, 'https://'))) {
                $baseUrl = url('/');
                if (str_starts_with($path, $baseUrl)) {
                    return ltrim(substr($path, strlen($baseUrl)), '/');
                }
            }
            return $path;
        }, $imagePath);

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

        if ($image->product) {
            $image->product->syncThumbnails();
        }

        return response()->json($image);
    }

    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $image = ProductImage::findOrFail($id);

        // Delete physical file from disk
        UploadHelper::deleteImage($image->getRawOriginal('image_path'));

        $image->delete();

        return response()->json(['detail' => 'Product image deleted successfully.']);
    }
}
