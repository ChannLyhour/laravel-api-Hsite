<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductTranslation;
use App\Models\ProductVariant;
use App\Models\ProductImage;
use App\Models\ProductAttribute;
use App\Models\ProductAttributeValue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Helpers\UploadHelper;

class ProductController extends Controller
{
    public function store(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        // Detect if payload is legacy format or new structured format
        $isLegacy = ! $request->has('translations') && ! $request->has('variants');

        if ($isLegacy) {
            $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'required|numeric',
                'image' => 'nullable',
                'image_url' => 'nullable|string',
                'status' => 'required|in:available,unavailable,active,draft,archived',
                'category_id' => 'nullable|integer|exists:categories,id',
                'created_by' => 'nullable|integer|exists:users,id',
            ]);
        } else {
            $request->validate([
                'sku' => 'required|string|max:100|unique:products,sku',
                'barcode' => 'nullable|string|max:50',
                'status' => 'required|in:active,draft,archived',
                'category_id' => 'nullable|integer|exists:categories,id',
                'created_by' => 'nullable|integer|exists:users,id',
                'has_options' => 'nullable|boolean',
                
                // Translations
                'translations' => 'required|array|min:1',
                'translations.*.locale' => 'required|string|max:5',
                'translations.*.name' => 'required|string|max:255',
                'translations.*.description' => 'nullable|string',
                'translations.*.slug' => 'required|string|max:255',
                
                // Variants
                'variants' => 'required|array|min:1',
                'variants.*.variant_sku' => 'required|string|max:100|unique:product_variants,variant_sku',
                'variants.*.region_code' => 'nullable|string|max:3',
                'variants.*.currency_code' => 'nullable|string|max:3',
                'variants.*.purchase_price' => 'required|numeric|min:0',
                'variants.*.retail_price' => 'required|numeric|min:0',
                'variants.*.compare_at_price' => 'nullable|numeric|min:0',
                'variants.*.stock_qty' => 'required|integer|min:0',
                'variants.*.low_stock_threshold' => 'nullable|integer|min:0',
                'variants.*.attribute_values' => 'nullable|array',
                'variants.*.attribute_values.*' => 'integer|exists:product_attribute_values,id',
            ]);
        }

        $userId = $request->created_by ?? $request->user()->id;

        return DB::transaction(function () use ($request, $isLegacy, $userId) {
            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = UploadHelper::uploadImage($request->file('image'), 'products');
            } elseif ($request->has('image') && is_string($request->image)) {
                $imagePath = $request->image;
            } elseif ($request->has('image_url')) {
                $imagePath = $request->image_url;
            }

            // Clean domain URL prefix if present
            if ($imagePath && (str_starts_with($imagePath, 'http://') || str_starts_with($imagePath, 'https://'))) {
                $baseUrl = url('/');
                if (str_starts_with($imagePath, $baseUrl)) {
                    $imagePath = ltrim(substr($imagePath, strlen($baseUrl)), '/');
                }
            }

            if ($isLegacy) {
                // Determine status
                $status = $request->status;
                if ($status === 'available') {
                    $status = 'active';
                } elseif ($status === 'unavailable') {
                    $status = 'draft';
                }

                $sku = 'PROD-' . Str::upper(Str::random(10));
                
                $product = Product::create([
                    'category_id' => $request->category_id,
                    'sku' => $sku,
                    'barcode' => null,
                    'status' => $status,
                    'created_by' => $userId,
                ]);

                // Create translation
                ProductTranslation::create([
                    'product_id' => $product->id,
                    'locale' => 'en',
                    'name' => $request->name,
                    'description' => $request->description,
                    'slug' => Str::slug($request->name),
                    'created_by' => $userId,
                ]);

                // Create variant
                ProductVariant::create([
                    'product_id' => $product->id,
                    'variant_sku' => $sku . '-GLO',
                    'region_code' => 'GLO',
                    'currency_code' => 'USD',
                    'purchase_price' => 0.00,
                    'retail_price' => $request->price,
                    'stock_qty' => 100,
                    'created_by' => $userId,
                ]);

                if ($imagePath) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_path' => $imagePath,
                        'is_primary' => true,
                        'sort_order' => 1,
                        'created_by' => $userId,
                    ]);
                }

            } else {
                $product = Product::create([
                    'category_id' => $request->category_id,
                    'sku' => $request->sku,
                    'barcode' => $request->barcode,
                    'status' => $request->status,
                    'created_by' => $userId,
                    'has_options' => $request->has_options ?? false,
                ]);

                foreach ($request->translations as $trans) {
                    ProductTranslation::create([
                        'product_id' => $product->id,
                        'locale' => $trans['locale'],
                        'name' => $trans['name'],
                        'description' => $trans['description'] ?? null,
                        'slug' => $trans['slug'],
                        'created_by' => $userId,
                    ]);
                }

                $variantModels = [];
                foreach ($request->variants as $index => $var) {
                    $variantModel = ProductVariant::create([
                        'product_id' => $product->id,
                        'variant_sku' => $var['variant_sku'],
                        'region_code' => $var['region_code'] ?? 'GLO',
                        'currency_code' => $var['currency_code'] ?? 'USD',
                        'purchase_price' => $var['purchase_price'],
                        'retail_price' => $var['retail_price'],
                        'compare_at_price' => $var['compare_at_price'] ?? null,
                        'stock_qty' => $var['stock_qty'],
                        'low_stock_threshold' => $var['low_stock_threshold'] ?? 5,
                        'created_by' => $userId,
                    ]);
                    if (isset($var['attribute_values']) && is_array($var['attribute_values'])) {
                        $variantModel->attributeValues()->sync($var['attribute_values']);
                    }
                    $variantModels[] = $variantModel;

                    // Handle variant image during creation
                    $varImagePath = null;
                    if ($request->hasFile("variants.{$index}.image")) {
                        $varImagePath = UploadHelper::uploadImage($request->file("variants.{$index}.image"), 'products');
                    } elseif (isset($var['image_url'])) {
                        $varImagePath = $var['image_url'];
                    }

                    if ($varImagePath) {
                        if (str_starts_with($varImagePath, 'http://') || str_starts_with($varImagePath, 'https://')) {
                            $baseUrl = url('/');
                            if (str_starts_with($varImagePath, $baseUrl)) {
                                $varImagePath = ltrim(substr($varImagePath, strlen($baseUrl)), '/');
                            }
                        }

                        ProductImage::create([
                            'product_id' => $product->id,
                            'product_variant_id' => $variantModel->id,
                            'image_path' => $varImagePath,
                            'is_primary' => false,
                            'sort_order' => 0,
                            'created_by' => $userId,
                        ]);
                    }
                }

                // If root image provided, add it as primary
                if ($imagePath) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_path' => $imagePath,
                        'is_primary' => true,
                        'sort_order' => 1,
                        'created_by' => $userId,
                    ]);
                }

                // If extra images array provided
                if ($request->has('images') && is_array($request->images)) {
                    foreach ($request->images as $img) {
                        $variantId = null;
                        if (isset($img['variant_index']) && isset($variantModels[$img['variant_index']])) {
                            $variantId = $variantModels[$img['variant_index']]->id;
                        }

                        ProductImage::create([
                            'product_id' => $product->id,
                            'product_variant_id' => $variantId,
                            'image_path' => $img['image_path'],
                            'is_primary' => $img['is_primary'] ?? false,
                            'sort_order' => $img['sort_order'] ?? 0,
                            'created_by' => $userId,
                        ]);
                    }
                }
            }

            $product->load(['translations', 'variants.attributeValues.attribute', 'images']);
            return response()->json($product, 201);
        });
    }

    public function index(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $user = $request->user();
        $query = Product::query()->with(['translations', 'variants.attributeValues.attribute', 'images']);

        if ($user && $user->role_id != 1) {
            $query->where('created_by', $user->id);
        } else {
            $createdBy = $request->query('created_by');
            if ($createdBy !== null) {
                $query->where('created_by', $createdBy);
            }
        }

        $categoryId = $request->query('category_id');
        if ($categoryId !== null) {
            $query->where('category_id', $categoryId);
        }

        $items = $query->skip($skip)->take($limit)->get();
        return response()->json($items);
    }

    public function topSelling(Request $request)
    {
        $limit = $request->query('limit', 3);
        $createdBy = $request->query('created_by');

        $query = Product::query()->with(['translations', 'variants.attributeValues.attribute', 'images']);
        if ($createdBy !== null) {
            $query->where('created_by', $createdBy);
        }

        $items = $query->limit($limit)->get();
        return response()->json($items);
    }

    public function show($id)
    {
        $product = Product::with(['translations', 'variants.attributeValues.attribute', 'images'])->findOrFail($id);
        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $product = Product::findOrFail($id);
        $isLegacy = ! $request->has('translations') && ! $request->has('variants');

        if ($isLegacy) {
            $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'sometimes|required|numeric',
                'image' => 'nullable',
                'image_url' => 'nullable|string',
                'status' => 'sometimes|required|in:available,unavailable,active,draft,archived',
                'category_id' => 'nullable|integer|exists:categories,id',
            ]);
        } else {
            $request->validate([
                'sku' => 'sometimes|required|string|max:100|unique:products,sku,' . $product->id,
                'barcode' => 'nullable|string|max:50',
                'status' => 'sometimes|required|in:active,draft,archived',
                'category_id' => 'nullable|integer|exists:categories,id',
                'has_options' => 'nullable|boolean',
                'variants' => 'sometimes|array',
                'variants.*.id' => 'nullable|integer|exists:product_variants,id',
                'variants.*.variant_sku' => 'required|string|max:100',
                'variants.*.region_code' => 'nullable|string|max:3',
                'variants.*.currency_code' => 'nullable|string|max:3',
                'variants.*.purchase_price' => 'required|numeric|min:0',
                'variants.*.retail_price' => 'required|numeric|min:0',
                'variants.*.compare_at_price' => 'nullable|numeric|min:0',
                'variants.*.stock_qty' => 'required|integer|min:0',
                'variants.*.low_stock_threshold' => 'nullable|integer|min:0',
                'variants.*.attribute_values' => 'nullable|array',
                'variants.*.attribute_values.*' => 'integer|exists:product_attribute_values,id',
            ]);
        }

        if ($request->has('variants')) {
            foreach ($request->variants as $var) {
                $query = ProductVariant::where('variant_sku', $var['variant_sku']);
                if (isset($var['id'])) {
                    $query->where('id', '!=', $var['id']);
                }
                if ($query->exists()) {
                    return response()->json([
                        'message' => "The variant SKU '{$var['variant_sku']}' has already been taken.",
                        'errors' => [
                            'variants' => ["The variant SKU '{$var['variant_sku']}' has already been taken."]
                        ]
                    ], 422);
                }
            }
        }

        return DB::transaction(function () use ($request, $product, $isLegacy) {
            $imagePath = null;
            $hasNewImage = false;

            if ($request->hasFile('image')) {
                // Delete previous primary image from disk if possible
                $primaryImage = $product->images->where('is_primary', true)->first();
                $oldPath = $primaryImage ? $primaryImage->getRawOriginal('image_path') : null;
                $imagePath = UploadHelper::updateImage($oldPath, $request->file('image'), 'products');
                $hasNewImage = true;
            } elseif ($request->has('image_url')) {
                $imagePath = $request->image_url;
                $hasNewImage = true;
            } elseif ($request->has('image') && is_string($request->image)) {
                $imagePath = $request->image;
                $hasNewImage = true;
            }

            // Clean domain URL prefix
            if ($imagePath && (str_starts_with($imagePath, 'http://') || str_starts_with($imagePath, 'https://'))) {
                $baseUrl = url('/');
                if (str_starts_with($imagePath, $baseUrl)) {
                    $imagePath = ltrim(substr($imagePath, strlen($baseUrl)), '/');
                }
            }

            if ($isLegacy) {
                $status = $product->status;
                if ($request->has('status')) {
                    $status = $request->status;
                    if ($status === 'available') {
                        $status = 'active';
                    } elseif ($status === 'unavailable') {
                        $status = 'draft';
                    }
                }

                $product->update([
                    'category_id' => $request->has('category_id') ? $request->category_id : $product->category_id,
                    'status' => $status,
                ]);

                // Update English Translation
                $translation = $product->translations()->where('locale', 'en')->first();
                if ($translation) {
                    $translation->update([
                        'name' => $request->name ?? $translation->name,
                        'description' => $request->has('description') ? $request->description : $translation->description,
                        'slug' => $request->name ? Str::slug($request->name) : $translation->slug,
                    ]);
                } else {
                    ProductTranslation::create([
                        'product_id' => $product->id,
                        'locale' => 'en',
                        'name' => $request->name ?? 'Product ' . $product->id,
                        'description' => $request->description ?? null,
                        'slug' => Str::slug($request->name ?? 'Product ' . $product->id),
                        'created_by' => $request->user()->id,
                    ]);
                }

                // Update first variant price
                $variant = $product->variants()->first();
                if ($variant) {
                    $variant->update([
                        'retail_price' => $request->price ?? $variant->retail_price,
                    ]);
                }

                // Update primary image
                if ($hasNewImage && $imagePath) {
                    $primaryImage = $product->images()->where('is_primary', true)->first();
                    if ($primaryImage) {
                        $primaryImage->update(['image_path' => $imagePath]);
                    } else {
                        ProductImage::create([
                            'product_id' => $product->id,
                            'image_path' => $imagePath,
                            'is_primary' => true,
                            'sort_order' => 1,
                            'created_by' => $request->user()->id,
                        ]);
                    }
                }

            } else {
                // Advanced structured payload update
                $product->update([
                    'sku' => $request->sku ?? $product->sku,
                    'barcode' => $request->has('barcode') ? $request->barcode : $product->barcode,
                    'status' => $request->status ?? $product->status,
                    'category_id' => $request->has('category_id') ? $request->category_id : $product->category_id,
                    'has_options' => $request->has('has_options') ? $request->has_options : $product->has_options,
                ]);

                if ($request->has('translations')) {
                    foreach ($request->translations as $trans) {
                        ProductTranslation::updateOrCreate(
                            ['product_id' => $product->id, 'locale' => $trans['locale']],
                            [
                                'name' => $trans['name'],
                                'description' => $trans['description'] ?? null,
                                'slug' => $trans['slug'],
                                'created_by' => $request->user()->id,
                            ]
                        );
                    }
                }

                if ($request->has('variants')) {
                    $keepIds = [];
                    foreach ($request->variants as $index => $var) {
                        $variant = null;
                        if (isset($var['id'])) {
                            $variant = ProductVariant::find($var['id']);
                        }
                        if ($variant && $variant->product_id == $product->id) {
                            $variant->update([
                                'variant_sku' => $var['variant_sku'],
                                'region_code' => $var['region_code'] ?? 'GLO',
                                'currency_code' => $var['currency_code'] ?? 'USD',
                                'purchase_price' => $var['purchase_price'],
                                'retail_price' => $var['retail_price'],
                                'compare_at_price' => $var['compare_at_price'] ?? null,
                                'stock_qty' => $var['stock_qty'],
                                'low_stock_threshold' => $var['low_stock_threshold'] ?? 5,
                            ]);
                        } else {
                            $variant = ProductVariant::create([
                                'product_id' => $product->id,
                                'variant_sku' => $var['variant_sku'],
                                'region_code' => $var['region_code'] ?? 'GLO',
                                'currency_code' => $var['currency_code'] ?? 'USD',
                                'purchase_price' => $var['purchase_price'],
                                'retail_price' => $var['retail_price'],
                                'compare_at_price' => $var['compare_at_price'] ?? null,
                                'stock_qty' => $var['stock_qty'],
                                'low_stock_threshold' => $var['low_stock_threshold'] ?? 5,
                                'created_by' => $request->user()->id,
                            ]);
                        }
                        if (isset($var['attribute_values']) && is_array($var['attribute_values'])) {
                            $variant->attributeValues()->sync($var['attribute_values']);
                        } else {
                            $variant->attributeValues()->detach();
                        }
                        $keepIds[] = $variant->id;

                        // Handle variant image in update
                        $varImagePath = null;
                        $hasVarImage = false;
                        if ($request->hasFile("variants.{$index}.image")) {
                            $oldImage = ProductImage::where('product_variant_id', $variant->id)->first();
                            $oldPath = $oldImage ? $oldImage->getRawOriginal('image_path') : null;
                            $varImagePath = UploadHelper::updateImage($oldPath, $request->file("variants.{$index}.image"), 'products');
                            $hasVarImage = true;
                        } elseif (isset($var['image_url'])) {
                            $varImagePath = $var['image_url'];
                            $hasVarImage = true;
                        }

                        if ($hasVarImage) {
                            if ($varImagePath && (str_starts_with($varImagePath, 'http://') || str_starts_with($varImagePath, 'https://'))) {
                                $baseUrl = url('/');
                                if (str_starts_with($varImagePath, $baseUrl)) {
                                    $varImagePath = ltrim(substr($varImagePath, strlen($baseUrl)), '/');
                                }
                            }

                            if ($varImagePath) {
                                ProductImage::updateOrCreate(
                                    ['product_id' => $product->id, 'product_variant_id' => $variant->id],
                                    [
                                        'image_path' => $varImagePath,
                                        'is_primary' => false,
                                        'sort_order' => 0,
                                        'created_by' => $request->user()->id,
                                    ]
                                );
                            } else {
                                $existing = ProductImage::where('product_variant_id', $variant->id)->first();
                                if ($existing) {
                                    UploadHelper::deleteImage($existing->getRawOriginal('image_path'));
                                    $existing->delete();
                                }
                            }
                        }
                    }
                    $product->variants()->whereNotIn('id', $keepIds)->delete();
                }

                if ($hasNewImage && $imagePath) {
                    $primaryImage = $product->images()->where('is_primary', true)->first();
                    if ($primaryImage) {
                        $primaryImage->update(['image_path' => $imagePath]);
                    } else {
                        ProductImage::create([
                            'product_id' => $product->id,
                            'image_path' => $imagePath,
                            'is_primary' => true,
                            'sort_order' => 1,
                            'created_by' => $request->user()->id,
                        ]);
                    }
                }
            }

            $product->load(['translations', 'variants.attributeValues.attribute', 'images']);
            return response()->json($product);
        });
    }

    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $product = Product::findOrFail($id);

        // Delete all associated files
        foreach ($product->images as $img) {
            UploadHelper::deleteImage($img->getRawOriginal('image_path'));
        }

        $product->delete();

        return response()->json(['detail' => 'Product deleted successfully.']);
    }
}
