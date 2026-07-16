<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductTranslation;
use App\Models\ProductVariant;
use App\Models\ProductImage;
use App\Models\ProductAttribute;
use App\Models\ProductAttributeValue;
use App\Models\ProductAddon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Helpers\UploadHelper;

class ProductController extends Controller
{
    public function store(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        if ($request->has('social_media_link')) {
            $val = $request->input('social_media_link');
            if (is_string($val)) {
                $decoded = json_decode($val, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $request->merge(['social_media_link' => $decoded]);
                }
            }
        }

        // Detect if payload is legacy format or new structured format
        \Log::info('Product store payload: ' . json_encode($request->except(['image', 'images', 'imageFile'])));
        $isLegacy = ! $request->has('translations') && ! $request->has('variants');

        if ($isLegacy) {
            $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'required|numeric',
                'image' => 'nullable',
                'image_url' => 'nullable',
                'status' => 'required|in:available,unavailable,active,draft,archived',
                'is_special' => 'nullable|boolean',
                'category_id' => 'nullable|integer|exists:categories,id',
                'created_by' => 'nullable|integer|exists:users,id',
                'social_media_link' => 'nullable|array',
                
                // Addons
                'addons' => 'nullable|array',
                'addons.*.addon_name' => 'required|string|max:255',
                'addons.*.additional_price' => 'required|numeric|min:0',
                'addons.*.discount' => 'nullable|numeric|min:0',
                'addons.*.discount_type' => 'nullable|string|in:flat,percent',
                'addons.*.image' => 'nullable',
                'addons.*.is_default' => 'nullable',
            ]);
        } else {
            $request->validate([
                'sku' => 'required|string|max:100|unique:products,sku',
                'barcode' => 'nullable|string|max:50',
                'status' => 'required|in:active,draft,archived',
                'is_special' => 'nullable|boolean',
                'category_id' => 'nullable|integer|exists:categories,id',
                'created_by' => 'nullable|integer|exists:users,id',
                'has_options' => 'nullable|boolean',
                'product_type' => 'nullable|string|max:50',
                'brand_id' => 'nullable|integer|exists:brands,id',
                'product_badge_id' => 'nullable|integer|exists:product_badges,id',
                'unit' => 'nullable|string|max:50',
                'search_tags' => 'nullable|string',
                'min_order_qty' => 'nullable|integer|min:1',
                'discount_amount' => 'nullable|numeric|min:0',
                'discount_type' => 'nullable|string|in:flat,percent',
                'shipping_cost' => 'nullable|numeric|min:0',
                'multiply_qty_shipping' => 'nullable|boolean',
                'social_media_link' => 'nullable|array',
                
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
                'variants.*.image' => 'nullable|file|image|max:2048',
                
                // Addons
                'addons' => 'nullable|array',
                'addons.*.addon_name' => 'required|string|max:255',
                'addons.*.additional_price' => 'required|numeric|min:0',
                'addons.*.discount' => 'nullable|numeric|min:0',
                'addons.*.discount_type' => 'nullable|string|in:flat,percent',
                'addons.*.image' => 'nullable',
                'addons.*.is_default' => 'nullable',
            ]);
        }

        $userId = $request->created_by ?? $request->user()->id;

        return DB::transaction(function () use ($request, $isLegacy, $userId) {
            $imagePaths = [];
            if ($request->hasFile('image')) {
                $files = $request->file('image');
                if (is_array($files)) {
                    foreach ($files as $file) {
                        $imagePaths[] = UploadHelper::uploadImage($file, 'products');
                    }
                } else {
                    $imagePaths[] = UploadHelper::uploadImage($files, 'products');
                }
            } elseif ($request->has('image') && is_array($request->image)) {
                $imagePaths = $request->image;
            } elseif ($request->has('image') && is_string($request->image)) {
                if (str_starts_with($request->image, '[') || str_starts_with($request->image, '{')) {
                    $decoded = json_decode($request->image, true);
                    $imagePaths = is_array($decoded) ? $decoded : [$request->image];
                } else {
                    $imagePaths = [$request->image];
                }
            } elseif ($request->has('image_url')) {
                if (is_array($request->image_url)) {
                    $imagePaths = $request->image_url;
                } else {
                    $imagePaths = [$request->image_url];
                }
            }

            // Clean domain URL prefix if present
            $imagePaths = array_map(function ($path) {
                if ($path && (str_starts_with($path, 'http://') || str_starts_with($path, 'https://'))) {
                    $baseUrl = url('/');
                    if (str_starts_with($path, $baseUrl)) {
                        return ltrim(substr($path, strlen($baseUrl)), '/');
                    }
                }
                return $path;
            }, $imagePaths);

            // Filter out empty or null values
            $imagePaths = array_filter($imagePaths, function ($path) {
                return $path !== null && trim($path) !== '';
            });

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
                    'is_special' => filter_var($request->is_special ?? false, FILTER_VALIDATE_BOOLEAN),
                    'created_by' => $userId,
                    'social_media_link' => $request->social_media_link ?? null,
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

                if (!empty($imagePaths)) {
                    foreach ($imagePaths as $index => $path) {
                        ProductImage::create([
                            'product_id' => $product->id,
                            'image' => $path,
                            'is_primary' => $index === 0,
                            'sort_order' => $index + 1,
                            'created_by' => $userId,
                        ]);
                    }
                }

            } else {
                $product = Product::create([
                    'category_id' => $request->category_id,
                    'sku' => $request->sku,
                    'barcode' => $request->barcode,
                    'status' => $request->status,
                    'is_special' => filter_var($request->is_special ?? false, FILTER_VALIDATE_BOOLEAN),
                    'created_by' => $userId,
                    'has_options' => $request->has_options ?? false,
                    'product_type' => $request->product_type ?? 'physical',
                    'brand_id' => $request->brand_id ?? null,
                    'product_badge_id' => $request->product_badge_id ?? null,
                    'unit' => $request->unit ?? 'pc',
                    'search_tags' => $request->search_tags ?? null,
                    'min_order_qty' => $request->min_order_qty ?? 1,
                    'discount_amount' => $request->discount_amount ?? 0.00,
                    'discount_type' => $request->discount_type ?? 'flat',
                    'shipping_cost' => $request->shipping_cost ?? 0.00,
                    'multiply_qty_shipping' => $request->multiply_qty_shipping ?? false,
                    'social_media_link' => $request->social_media_link ?? null,
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
                    $varImagePaths = [];
                    if ($request->hasFile("variants.{$index}.image")) {
                        $varFiles = $request->file("variants.{$index}.image");
                        if (is_array($varFiles)) {
                            foreach ($varFiles as $file) {
                                $varImagePaths[] = UploadHelper::uploadImage($file, 'products');
                            }
                        } else {
                            $varImagePaths[] = UploadHelper::uploadImage($varFiles, 'products');
                        }
                    } elseif (isset($var['image_url'])) {
                        if (is_array($var['image_url'])) {
                            $varImagePaths = $var['image_url'];
                        } else {
                            $varImagePaths = [$var['image_url']];
                        }
                    }

                    if (!empty($varImagePaths)) {
                        $varImagePaths = array_map(function ($path) {
                            if ($path && (str_starts_with($path, 'http://') || str_starts_with($path, 'https://'))) {
                                $baseUrl = url('/');
                                if (str_starts_with($path, $baseUrl)) {
                                    return ltrim(substr($path, strlen($baseUrl)), '/');
                                }
                            }
                            return $path;
                        }, $varImagePaths);

                        $varImagePaths = array_filter($varImagePaths, function ($path) {
                            return $path !== null && trim($path) !== '';
                        });

                        foreach ($varImagePaths as $varImgIndex => $img) {
                            ProductImage::create([
                                'product_id' => $product->id,
                                'product_variant_id' => $variantModel->id,
                                'image' => $img,
                                'is_primary' => false,
                                'sort_order' => $varImgIndex,
                                'created_by' => $userId,
                            ]);
                        }
                    }
                }

                // If root images provided, add them as product images (first is primary)
                if (!empty($imagePaths)) {
                    foreach ($imagePaths as $index => $path) {
                        ProductImage::create([
                            'product_id' => $product->id,
                            'image' => $path,
                            'is_primary' => $index === 0,
                            'sort_order' => $index + 1,
                            'created_by' => $userId,
                        ]);
                    }
                }

                // If extra images array provided
                if ($request->has('images') && is_array($request->images)) {
                    foreach ($request->images as $img) {
                        $variantId = null;
                        if (isset($img['variant_index']) && isset($variantModels[$img['variant_index']])) {
                            $variantId = $variantModels[$img['variant_index']]->id;
                        }

                        $imgPath = $img['image'] ?? $img['image_path'] ?? null;
                        if (is_array($imgPath)) {
                            foreach ($imgPath as $index => $subImg) {
                                ProductImage::create([
                                    'product_id' => $product->id,
                                    'product_variant_id' => $variantId,
                                    'image' => $subImg,
                                    'is_primary' => ($img['is_primary'] ?? false) && ($index === 0),
                                    'sort_order' => ($img['sort_order'] ?? 0) + $index,
                                    'created_by' => $userId,
                                ]);
                            }
                        } elseif ($imgPath !== null) {
                            ProductImage::create([
                                'product_id' => $product->id,
                                'product_variant_id' => $variantId,
                                'image' => $imgPath,
                                'is_primary' => $img['is_primary'] ?? false,
                                'sort_order' => $img['sort_order'] ?? 0,
                                'created_by' => $userId,
                            ]);
                        }
                    }
                }
            }

            if ($request->has('addons') && is_array($request->addons)) {
                foreach ($request->addons as $index => $addon) {
                    $addonImagePath = $addon['image'] ?? null;
                    if ($request->hasFile("addons.{$index}.image")) {
                        $addonFile = $request->file("addons.{$index}.image");
                        $addonImagePath = UploadHelper::uploadImage($addonFile, 'products');
                    }
                    ProductAddon::create([
                        'product_id' => $product->id,
                        'addon_name' => $addon['addon_name'],
                        'additional_price' => $addon['additional_price'] ?? 0.00,
                        'discount' => $addon['discount'] ?? 0.00,
                        'discount_type' => $addon['discount_type'] ?? 'flat',
                        'image' => $addonImagePath,
                        'is_default' => filter_var($addon['is_default'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    ]);
                }
            } 
            
            $product->load(['translations', 'variants.attributeValues.attribute', 'images', 'brand', 'badge', 'addons']);
            \Illuminate\Support\Facades\Cache::forget("products_version_owner_" . $product->created_by);
            return response()->json($product, 201);
        });
    }

    public function index(Request $request)
    {
        $start = microtime(true);

        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 24);
        $categoryId = $request->query('category_id');

        $user = $request->user();
        $createdBy = $request->get('current_store_owner_id') ?? $request->query('created_by');

        $ownerIdForCache = $createdBy;
        if ($user && $user->role_id != 1) {
            $ownerIdForCache = $user->id;
        }

        $ownerKey = $ownerIdForCache ?? 'all';

        // Retrieve/remember the products cache version for this owner
        $version = \Illuminate\Support\Facades\Cache::remember("products_version_owner_{$ownerKey}", 86400 * 365, function() {
            return time();
        });

        // Construct a unique cache key based on query params and version
        $cacheKey = "products_index_owner_{$ownerKey}_v{$version}_skip_{$skip}_limit_{$limit}_cat_{$categoryId}";

        $result = \Illuminate\Support\Facades\Cache::remember($cacheKey, 600, function () use ($user, $ownerIdForCache, $categoryId, $skip, $limit) {
            $query = Product::query();
            
            if ($user && $user->role_id != 1) {
                $query->where('created_by', $user->id);
            } else {
                if ($ownerIdForCache !== null) {
                    $query->where('created_by', $ownerIdForCache);
                }
            }
            
            if ($categoryId !== null) {
                $query->where('category_id', $categoryId);
            }

            $total = $query->count();

            $items = $query->with([
                'translations',
                'variants' => function ($q) {
                    $q->without(['stockBatches']);
                },
                'images',
                'brand',
                'badge'
            ])
                ->skip($skip)
                ->take($limit)
                ->get();

            return [
                'total' => $total,
                'items' => $items
            ];
        });

        $items = $result['items'];
        $total = $result['total'];

        $duration = (microtime(true) - $start) * 1000;
        \Log::info(sprintf(
            "ProductController@index execution: %.2f ms",
            $duration
        ));

        return response()->json($items)
            ->header('X-Total-Count', $total)
            ->header('Access-Control-Expose-Headers', 'X-Total-Count');
    }

    public function topSelling(Request $request)
    {
        $limit = $request->query('limit', 3);
        $createdBy = $request->get('current_store_owner_id') ?? $request->query('created_by');

        $version = \Illuminate\Support\Facades\Cache::remember("products_version_owner_{$createdBy}", 86400 * 365, function() {
            return time();
        });
        $cacheKey = "products_topselling_owner_{$createdBy}_v{$version}_limit_{$limit}";

        $items = \Illuminate\Support\Facades\Cache::remember($cacheKey, 86400 * 30, function () use ($createdBy, $limit) {
            $query = Product::query()->with([
                'translations',
                'variants' => function ($q) {
                    $q->without(['stockBatches']);
                },
                'images',
                'brand',
                'badge',
                'addons'
            ]);
            if ($createdBy !== null) {
                $query->where('created_by', $createdBy);
            }
            return $query->limit($limit)->get();
        });

        return response()->json($items);
    }

    public function show($id)
    {
        $product = Product::with(['translations', 'variants.attributeValues.attribute', 'images', 'brand', 'badge', 'addons'])->findOrFail($id);
        return response()->json($product);
    }

    public function showBySku($sku)
    {
        $product = Product::with(['translations', 'variants.attributeValues.attribute', 'images', 'brand', 'badge', 'addons'])
            ->where('sku', $sku)
            ->firstOrFail();
        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $product = Product::findOrFail($id);

        if ($request->has('social_media_link')) {
            $val = $request->input('social_media_link');
            if (is_string($val)) {
                $decoded = json_decode($val, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $request->merge(['social_media_link' => $decoded]);
                }
            }
        }

        \Log::info('Product update payload for ID ' . $id . ': ' . json_encode($request->except(['image', 'images', 'imageFile'])));
        $isLegacy = ! $request->has('translations') && ! $request->has('variants');

        if ($isLegacy) {
            $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'sometimes|required|numeric',
                'image' => 'nullable',
                'image_url' => 'nullable',
                'status' => 'sometimes|required|in:available,unavailable,active,draft,archived',
                'is_special' => 'nullable|boolean',
                'category_id' => 'nullable|integer|exists:categories,id',
                'social_media_link' => 'nullable|array',
                
                // Addons
                'addons' => 'sometimes|array',
                'addons.*.id' => 'nullable|integer|exists:product_addons,id',
                'addons.*.addon_name' => 'required|string|max:255',
                'addons.*.additional_price' => 'required|numeric|min:0',
                'addons.*.discount' => 'nullable|numeric|min:0',
                'addons.*.discount_type' => 'nullable|string|in:flat,percent',
                'addons.*.image' => 'nullable',
                'addons.*.is_default' => 'nullable',
            ]);
        } else {
            $request->validate([
                'sku' => 'sometimes|required|string|max:100|unique:products,sku,' . $product->id,
                'barcode' => 'nullable|string|max:50',
                'status' => 'sometimes|required|in:active,draft,archived',
                'is_special' => 'nullable|boolean',
                'category_id' => 'nullable|integer|exists:categories,id',
                'has_options' => 'nullable|boolean',
                'product_type' => 'nullable|string|max:50',
                'brand_id' => 'nullable|integer|exists:brands,id',
                'product_badge_id' => 'nullable|integer|exists:product_badges,id',
                'unit' => 'nullable|string|max:50',
                'search_tags' => 'nullable|string',
                'min_order_qty' => 'nullable|integer|min:1',
                'discount_amount' => 'nullable|numeric|min:0',
                'discount_type' => 'nullable|string|in:flat,percent',
                'shipping_cost' => 'nullable|numeric|min:0',
                'multiply_qty_shipping' => 'nullable|boolean',
                'social_media_link' => 'nullable|array',
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
                'variants.*.image' => 'nullable|file|image|max:2048',

                'addons' => 'sometimes|array',
                'addons.*.id' => 'nullable|integer|exists:product_addons,id',
                'addons.*.addon_name' => 'required|string|max:255',
                'addons.*.additional_price' => 'required|numeric|min:0',
                'addons.*.discount' => 'nullable|numeric|min:0',
                'addons.*.discount_type' => 'nullable|string|in:flat,percent',
                'addons.*.image' => 'nullable',
                'addons.*.is_default' => 'nullable',
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
            $imagePath = [];
            $hasNewImage = false;

            if ($request->hasFile('image')) {
                $files = $request->file('image');
                if ($isLegacy) {
                    $primaryImage = $product->images->where('is_primary', true)->first();
                    $oldPath = $primaryImage ? $primaryImage->getRawOriginal('image') : null;
                    if (is_array($files)) {
                        UploadHelper::deleteImage($oldPath);
                        foreach ($files as $file) {
                            $imagePath[] = UploadHelper::uploadImage($file, 'products');
                        }
                    } else {
                        $imagePath[] = UploadHelper::updateImage($oldPath, $files, 'products');
                    }
                } else {
                    if (is_array($files)) {
                        foreach ($files as $file) {
                            $imagePath[] = UploadHelper::uploadImage($file, 'products');
                        }
                    } else {
                        $imagePath[] = UploadHelper::uploadImage($files, 'products');
                    }
                }
                $hasNewImage = true;
            } elseif ($request->has('image') && is_array($request->image)) {
                $imagePath = $request->image;
                $hasNewImage = true;
            } elseif ($request->has('image') && is_string($request->image)) {
                if (str_starts_with($request->image, '[') || str_starts_with($request->image, '{')) {
                    $decoded = json_decode($request->image, true);
                    $imagePath = is_array($decoded) ? $decoded : [$request->image];
                } else {
                    $imagePath = [$request->image];
                }
                $hasNewImage = true;
            } elseif ($request->has('image_url')) {
                if (is_array($request->image_url)) {
                    $imagePath = $request->image_url;
                } else {
                    $imagePath = [$request->image_url];
                }
                $hasNewImage = true;
            }

            // Clean domain URL prefix
            $imagePath = array_map(function ($path) {
                if ($path && (str_starts_with($path, 'http://') || str_starts_with($path, 'https://'))) {
                    $baseUrl = url('/');
                    if (str_starts_with($path, $baseUrl)) {
                        return ltrim(substr($path, strlen($baseUrl)), '/');
                    }
                }
                return $path;
            }, $imagePath);

            // Filter out empty or null values
            $imagePath = array_filter($imagePath, function ($path) {
                return $path !== null && trim($path) !== '';
            });

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
                    'is_special' => $request->has('is_special') ? filter_var($request->is_special, FILTER_VALIDATE_BOOLEAN) : $product->is_special,
                    'social_media_link' => $request->has('social_media_link') ? $request->social_media_link : $product->social_media_link,
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
                if ($hasNewImage) {
                    $primaryImage = $product->images()->where('is_primary', true)->first();
                    if (!empty($imagePath)) {
                        if ($primaryImage) {
                            UploadHelper::deleteImage($primaryImage->getRawOriginal('image'));
                            $primaryImage->update(['image' => $imagePath[0]]);
                        } else {
                            ProductImage::create([
                                'product_id' => $product->id,
                                'image' => $imagePath[0],
                                'is_primary' => true,
                                'sort_order' => 1,
                                'created_by' => $request->user()->id,
                            ]);
                        }
                        for ($i = 1; $i < count($imagePath); $i++) {
                            ProductImage::create([
                                'product_id' => $product->id,
                                'image' => $imagePath[$i],
                                'is_primary' => false,
                                'sort_order' => $i + 1,
                                'created_by' => $request->user()->id,
                            ]);
                        }
                    } else {
                        if ($primaryImage) {
                            UploadHelper::deleteImage($primaryImage->getRawOriginal('image'));
                            $primaryImage->delete();
                        }
                    }
                }

            } else {
                $product->update([
                    'sku' => $request->sku ?? $product->sku,
                    'barcode' => $request->has('barcode') ? $request->barcode : $product->barcode,
                    'status' => $request->status ?? $product->status,
                    'is_special' => $request->has('is_special') ? filter_var($request->is_special, FILTER_VALIDATE_BOOLEAN) : $product->is_special,
                    'category_id' => $request->has('category_id') ? $request->category_id : $product->category_id,
                    'has_options' => $request->has('has_options') ? $request->has_options : $product->has_options,
                    'product_type' => $request->product_type ?? $product->product_type,
                    'brand_id' => $request->has('brand_id') ? $request->brand_id : $product->brand_id,
                    'product_badge_id' => $request->has('product_badge_id') ? $request->product_badge_id : $product->product_badge_id,
                    'unit' => $request->unit ?? $product->unit,
                    'search_tags' => $request->has('search_tags') ? $request->search_tags : $product->search_tags,
                    'min_order_qty' => $request->min_order_qty ?? $product->min_order_qty,
                    'discount_amount' => $request->discount_amount ?? $product->discount_amount,
                    'discount_type' => $request->discount_type ?? $product->discount_type,
                    'shipping_cost' => $request->shipping_cost ?? $product->shipping_cost,
                    'multiply_qty_shipping' => $request->multiply_qty_shipping ?? $product->multiply_qty_shipping,
                    'social_media_link' => $request->has('social_media_link') ? $request->social_media_link : $product->social_media_link,
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
                        $varImagePath = [];
                        $hasVarImage = false;
                        if ($request->hasFile("variants.{$index}.image")) {
                            $oldImage = ProductImage::where('product_variant_id', $variant->id)->first();
                            $oldPath = $oldImage ? $oldImage->getRawOriginal('image') : null;
                            $varFiles = $request->file("variants.{$index}.image");
                            if (is_array($varFiles)) {
                                UploadHelper::deleteImage($oldPath);
                                foreach ($varFiles as $file) {
                                    $varImagePath[] = UploadHelper::uploadImage($file, 'products');
                                }
                            } else {
                                $varImagePath[] = UploadHelper::updateImage($oldPath, $varFiles, 'products');
                            }
                            $hasVarImage = true;
                        } elseif (isset($var['image_url'])) {
                            if (is_array($var['image_url'])) {
                                $varImagePath = $var['image_url'];
                            } else {
                                $varImagePath = [$var['image_url']];
                            }
                            $hasVarImage = true;
                        }

                        if ($hasVarImage) {
                            $varImagePath = array_map(function ($path) {
                                if ($path && (str_starts_with($path, 'http://') || str_starts_with($path, 'https://'))) {
                                    $baseUrl = url('/');
                                    if (str_starts_with($path, $baseUrl)) {
                                        return ltrim(substr($path, strlen($baseUrl)), '/');
                                    }
                                }
                                return $path;
                            }, $varImagePath);

                            $varImagePath = array_filter($varImagePath, function ($path) {
                                return $path !== null && trim($path) !== '';
                            });

                            if (!empty($varImagePath)) {
                                ProductImage::updateOrCreate(
                                    ['product_id' => $product->id, 'product_variant_id' => $variant->id],
                                    [
                                        'image' => $varImagePath[0] ?? null,
                                        'is_primary' => false,
                                        'sort_order' => 0,
                                        'created_by' => $request->user()->id,
                                    ]
                                );
                            } else {
                                $existing = ProductImage::where('product_variant_id', $variant->id)->first();
                                if ($existing) {
                                    UploadHelper::deleteImage($existing->getRawOriginal('image'));
                                    $existing->delete();
                                }
                            }
                        }
                    }
                    $product->variants()->whereNotIn('id', $keepIds)->delete();
                }

                if ($hasNewImage) {
                    if (!empty($imagePath)) {
                        // Find the current primary image before resetting flags
                        $primaryImage = ProductImage::where('product_id', $product->id)->where('is_primary', true)->first();

                        // Reset all other images of this product to non-primary
                        ProductImage::where('product_id', $product->id)->update(['is_primary' => false]);
  
                        // Check if primary image already exists to prevent duplicate rows
                        $existingImage = ProductImage::where('product_id', $product->id)
                            ->where('image', $imagePath[0])
                            ->first();
 
                        if ($existingImage) {
                            $existingImage->update([
                                'is_primary' => true,
                                'sort_order' => 1,
                            ]);
                        } else {
                            if ($primaryImage) {
                                // Delete old file from disk to avoid storage leak
                                UploadHelper::deleteImage($primaryImage->getRawOriginal('image'));
                                // Update existing primary image record with the new path
                                $primaryImage->update([
                                    'image' => $imagePath[0],
                                    'is_primary' => true,
                                    'sort_order' => 1,
                                ]);
                            } else {
                                // Create new primary image record
                                ProductImage::create([
                                    'product_id' => $product->id,
                                    'image' => $imagePath[0],
                                    'is_primary' => true,
                                    'sort_order' => 1,
                                    'created_by' => $request->user()->id,
                                ]);
                            }
                        }

                        for ($i = 1; $i < count($imagePath); $i++) {
                            // Check if secondary image already exists
                            $existingSecImage = ProductImage::where('product_id', $product->id)
                                ->where('image', $imagePath[$i])
                                ->first();

                            if ($existingSecImage) {
                                $existingSecImage->update([
                                    'is_primary' => false,
                                    'sort_order' => $i + 1,
                                ]);
                            } else {
                                ProductImage::create([
                                    'product_id' => $product->id,
                                    'image' => $imagePath[$i],
                                    'is_primary' => false,
                                    'sort_order' => $i + 1,
                                    'created_by' => $request->user()->id,
                                ]);
                            }
                        }
                    } else {
                        $primaryImage = $product->images()->where('is_primary', true)->first();
                        if ($primaryImage) {
                            UploadHelper::deleteImage($primaryImage->getRawOriginal('image'));
                            $primaryImage->delete();
                        }
                    }
                }
            }

            if ($request->has('addons') || $request->input('clear_addons') == 1) {
                $keepAddonIds = [];
                if (is_array($request->addons)) {
                    foreach ($request->addons as $index => $addon) {
                        $addonImagePath = $addon['image'] ?? null;
                        if ($request->hasFile("addons.{$index}.image")) {
                            $addonFile = $request->file("addons.{$index}.image");
                            if (isset($addon['id'])) {
                                $existingModel = ProductAddon::where('product_id', $product->id)->find($addon['id']);
                                if ($existingModel && $existingModel->image) {
                                    UploadHelper::deleteImage($existingModel->getRawOriginal('image'));
                                }
                            }
                            $addonImagePath = UploadHelper::uploadImage($addonFile, 'products');
                        }
                        if (isset($addon['id'])) {
                            $addonModel = ProductAddon::where('product_id', $product->id)->find($addon['id']);
                            if ($addonModel) {
                                $addonModel->update([
                                    'addon_name' => $addon['addon_name'],
                                    'additional_price' => $addon['additional_price'],
                                    'discount' => $addon['discount'] ?? 0.00,
                                    'discount_type' => $addon['discount_type'] ?? 'flat',
                                    'image' => $addonImagePath,
                                    'is_default' => filter_var($addon['is_default'] ?? false, FILTER_VALIDATE_BOOLEAN),
                                ]);
                                $keepAddonIds[] = $addonModel->id;
                            }
                        } else {
                            $addonModel = ProductAddon::create([
                                'product_id' => $product->id,
                                'addon_name' => $addon['addon_name'],
                                'additional_price' => $addon['additional_price'],
                                'discount' => $addon['discount'] ?? 0.00,
                                'discount_type' => $addon['discount_type'] ?? 'flat',
                                'image' => $addonImagePath,
                                'is_default' => filter_var($addon['is_default'] ?? false, FILTER_VALIDATE_BOOLEAN),
                            ]);
                            $keepAddonIds[] = $addonModel->id;
                        }
                    }
                }
                $toDelete = $product->addons()->whereNotIn('id', $keepAddonIds)->get();
                foreach ($toDelete as $delAddon) {
                    if ($delAddon->image) {
                        UploadHelper::deleteImage($delAddon->getRawOriginal('image'));
                    }
                    $delAddon->delete();
                }
            }

            $product->load(['translations', 'variants.attributeValues.attribute', 'images', 'brand', 'badge', 'addons']);
            \Illuminate\Support\Facades\Cache::forget("products_version_owner_" . $product->created_by);
            return response()->json($product);
        });
    }

    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $product = Product::findOrFail($id);

        // Delete all associated files
        foreach ($product->images as $img) {
            UploadHelper::deleteImage($img->getRawOriginal('image'));
        }

        \Illuminate\Support\Facades\Cache::forget("products_version_owner_" . $product->created_by);
        $product->delete();

        return response()->json(['detail' => 'Product deleted successfully.']);
    }
}
