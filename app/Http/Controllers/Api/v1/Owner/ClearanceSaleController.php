<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\ClearanceSale;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Helpers\UploadHelper;

class ClearanceSaleController extends Controller
{
    /**
     * Public list of active clearance sales.
     */
    public function index(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $deals = ClearanceSale::where('is_active', true)
            ->with(['products' => function ($query) {
                $query->wherePivot('is_active', true)
                    ->with(['translations', 'variants']);
            }])
            ->orderBy('priority', 'desc')
            ->orderBy('id', 'desc')
            ->skip($skip)
            ->take($limit)
            ->get();

        return response()->json($deals);
    }

    /**
     * List all clearance sales for the logged-in user.
     */
    public function mine(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Not authorized.'], 403);
        }

        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $query = ClearanceSale::with(['products' => function ($query) {
            $query->with(['translations', 'variants']);
        }]);

        if ($user->role_id != 1) {
            $query->where('created_by', $user->id);
        } else {
            if ($request->filled('created_by')) {
                $query->where('created_by', $request->query('created_by'));
            }
        }

        $deals = $query->orderBy('priority', 'desc')->orderBy('id', 'desc')->skip($skip)->take($limit)->get();

        return response()->json($deals);
    }

    /**
     * Show details of a specific clearance sale.
     */
    public function show($id)
    {
        $deal = ClearanceSale::with(['products' => function ($query) {
            $query->with(['translations', 'variants']);
        }])->findOrFail($id);

        return response()->json($deal);
    }

    /**
     * Create a new clearance sale.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $data = $request->validate([
            'title'                => 'nullable|string|max:255',
            'is_active'            => 'nullable',
            'start_date'           => 'required|date',
            'end_date'             => 'required|date|after_or_equal:start_date',
            'discount_type'        => 'required|string|in:flat,product_wise',
            'discount_amount'      => 'nullable|numeric|min:0',
            'discount_amount_type' => 'nullable|string|in:flat,percent',
            'offer_active_time'    => 'required|string|in:always,specific_time',
            'active_start_time'    => 'nullable',
            'active_end_time'      => 'nullable',
            'show_in_home_page'    => 'nullable',
            'meta_title'           => 'nullable|string|max:255',
            'meta_description'     => 'nullable|string',
            'meta_image'           => 'nullable',
            'priority'             => 'nullable|integer',
        ]);

        $metaImagePath = null;
        if ($request->hasFile('meta_image')) {
            $metaImagePath = UploadHelper::uploadImage($request->file('meta_image'), 'clearance-sales/meta');
        } elseif (is_string($request->meta_image)) {
            $metaImagePath = $request->meta_image;
        }

        if ($metaImagePath && (str_starts_with($metaImagePath, 'http://') || str_starts_with($metaImagePath, 'https://'))) {
            $baseUrl = url('/');
            if (str_starts_with($metaImagePath, $baseUrl)) {
                $metaImagePath = ltrim(substr($metaImagePath, strlen($baseUrl)), '/');
            }
        }

        $deal = ClearanceSale::create([
            'title'                => $data['title'] ?? 'Clearance Sale',
            'is_active'            => $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : false,
            'start_date'           => $data['start_date'],
            'end_date'             => $data['end_date'],
            'discount_type'        => $data['discount_type'],
            'discount_amount'      => $data['discount_amount'] ?? null,
            'discount_amount_type' => $data['discount_amount_type'] ?? null,
            'offer_active_time'    => $data['offer_active_time'],
            'active_start_time'    => $data['active_start_time'] ?? null,
            'active_end_time'      => $data['active_end_time'] ?? null,
            'show_in_home_page'    => $request->has('show_in_home_page') ? filter_var($request->show_in_home_page, FILTER_VALIDATE_BOOLEAN) : false,
            'meta_title'           => $data['meta_title'] ?? null,
            'meta_description'     => $data['meta_description'] ?? null,
            'meta_image'           => $metaImagePath,
            'created_by'           => $user->id,
            'priority'             => $request->filled('priority') ? intval($request->priority) : 0,
        ]);

        if ($request->has('products')) {
            $products = is_array($request->products) ? $request->products : json_decode($request->products, true);
            if (is_array($products)) {
                $syncData = [];
                foreach ($products as $p) {
                    $pid = $p['product_id'] ?? $p['id'] ?? null;
                    if ($pid) {
                        $syncData[$pid] = [
                            'discount_amount' => $p['discount_amount'] ?? 0.00,
                            'discount_type'   => $p['discount_type'] ?? 'flat',
                            'is_active'       => isset($p['is_active']) ? filter_var($p['is_active'], FILTER_VALIDATE_BOOLEAN) : true,
                        ];
                    }
                }
                $deal->products()->sync($syncData);
            }
        } elseif ($request->has('product_ids')) {
            $productIds = is_array($request->product_ids) ? $request->product_ids : json_decode($request->product_ids, true);
            if (is_array($productIds)) {
                $deal->products()->sync($productIds);
            }
        }

        $deal->load(['products' => function ($query) {
            $query->with(['translations', 'variants']);
        }]);

        return response()->json($deal, 201);
    }

    /**
     * Update an existing clearance sale.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $deal = ClearanceSale::findOrFail($id);

        if ($user->role_id != 1 && $deal->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this clearance sale.'], 403);
        }

        $data = $request->validate([
            'title'                => 'sometimes|required|string|max:255',
            'is_active'            => 'nullable',
            'start_date'           => 'sometimes|required|date',
            'end_date'             => 'sometimes|required|date|after_or_equal:start_date',
            'discount_type'        => 'sometimes|required|string|in:flat,product_wise',
            'discount_amount'      => 'nullable|numeric|min:0',
            'discount_amount_type' => 'nullable|string|in:flat,percent',
            'offer_active_time'    => 'sometimes|required|string|in:always,specific_time',
            'active_start_time'    => 'nullable',
            'active_end_time'      => 'nullable',
            'show_in_home_page'    => 'nullable',
            'meta_title'           => 'nullable|string|max:255',
            'meta_description'     => 'nullable|string',
            'meta_image'           => 'nullable',
            'priority'             => 'nullable|integer',
        ]);

        $metaImagePath = $deal->getRawOriginal('meta_image');
        if ($request->hasFile('meta_image')) {
            if ($metaImagePath) {
                UploadHelper::deleteImage($metaImagePath);
            }
            $metaImagePath = UploadHelper::uploadImage($request->file('meta_image'), 'clearance-sales/meta');
        } elseif ($request->has('meta_image') && is_string($request->meta_image)) {
            $metaImagePath = $request->meta_image;
        }

        if ($metaImagePath && (str_starts_with($metaImagePath, 'http://') || str_starts_with($metaImagePath, 'https://'))) {
            $baseUrl = url('/');
            if (str_starts_with($metaImagePath, $baseUrl)) {
                $metaImagePath = ltrim(substr($metaImagePath, strlen($baseUrl)), '/');
            }
        }

        $updateData = [];
        if (isset($data['title'])) {
            $updateData['title'] = $data['title'];
        }
        if ($request->has('is_active')) {
            $updateData['is_active'] = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
        }
        if (isset($data['start_date'])) {
            $updateData['start_date'] = $data['start_date'];
        }
        if (isset($data['end_date'])) {
            $updateData['end_date'] = $data['end_date'];
        }
        if (isset($data['discount_type'])) {
            $updateData['discount_type'] = $data['discount_type'];
        }
        if ($request->has('discount_amount')) {
            $updateData['discount_amount'] = $data['discount_amount'];
        }
        if ($request->has('discount_amount_type')) {
            $updateData['discount_amount_type'] = $data['discount_amount_type'];
        }
        if (isset($data['offer_active_time'])) {
            $updateData['offer_active_time'] = $data['offer_active_time'];
        }
        if ($request->has('active_start_time')) {
            $updateData['active_start_time'] = $data['active_start_time'];
        }
        if ($request->has('active_end_time')) {
            $updateData['active_end_time'] = $data['active_end_time'];
        }
        if ($request->has('show_in_home_page')) {
            $updateData['show_in_home_page'] = filter_var($request->show_in_home_page, FILTER_VALIDATE_BOOLEAN);
        }
        if ($request->has('meta_title')) {
            $updateData['meta_title'] = $data['meta_title'];
        }
        if ($request->has('meta_description')) {
            $updateData['meta_description'] = $data['meta_description'];
        }
        if ($request->has('meta_image')) {
            $updateData['meta_image'] = $metaImagePath;
        }
        if ($request->has('priority')) {
            $updateData['priority'] = intval($request->priority);
        }

        $deal->update($updateData);

        if ($request->has('products')) {
            $products = is_array($request->products) ? $request->products : json_decode($request->products, true);
            if (is_array($products)) {
                $syncData = [];
                foreach ($products as $p) {
                    $pid = $p['product_id'] ?? $p['id'] ?? null;
                    if ($pid) {
                        $syncData[$pid] = [
                            'discount_amount' => $p['discount_amount'] ?? 0.00,
                            'discount_type'   => $p['discount_type'] ?? 'flat',
                            'is_active'       => isset($p['is_active']) ? filter_var($p['is_active'], FILTER_VALIDATE_BOOLEAN) : true,
                        ];
                    }
                }
                $deal->products()->sync($syncData);
            }
        } elseif ($request->has('product_ids')) {
            $productIds = is_array($request->product_ids) ? $request->product_ids : json_decode($request->product_ids, true);
            if (is_array($productIds)) {
                $deal->products()->sync($productIds);
            }
        }

        $deal->load(['products' => function ($query) {
            $query->with(['translations', 'variants']);
        }]);

        return response()->json($deal);
    }

    /**
     * Toggle the active status of the clearance sale.
     */
    public function toggle(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Not authorized.'], 403);
        }

        $deal = ClearanceSale::findOrFail($id);

        if ($user->role_id != 1 && $deal->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this clearance sale.'], 403);
        }

        $deal->update([
            'is_active' => ! $deal->is_active
        ]);

        return response()->json($deal);
    }

    /**
     * Delete a clearance sale.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $deal = ClearanceSale::findOrFail($id);

        if ($user->role_id != 1 && $deal->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this clearance sale.'], 403);
        }

        $metaImagePath = $deal->getRawOriginal('meta_image');
        if ($metaImagePath) {
            UploadHelper::deleteImage($metaImagePath);
        }

        $deal->delete();

        return response()->json(['detail' => 'Clearance sale deleted successfully.']);
    }

    /**
     * Associate products to a clearance sale.
     */
    public function addProducts(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Not authorized.'], 403);
        }

        $deal = ClearanceSale::findOrFail($id);

        if ($user->role_id != 1 && $deal->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this clearance sale.'], 403);
        }

        if ($request->has('products')) {
            $products = is_array($request->products) ? $request->products : json_decode($request->products, true);
            $syncData = [];
            foreach ($products as $p) {
                $pid = $p['product_id'] ?? $p['id'] ?? null;
                if ($pid) {
                    $syncData[$pid] = [
                        'discount_amount' => $p['discount_amount'] ?? 0.00,
                        'discount_type'   => $p['discount_type'] ?? 'flat',
                        'is_active'       => isset($p['is_active']) ? filter_var($p['is_active'], FILTER_VALIDATE_BOOLEAN) : true,
                    ];
                }
            }
            $deal->products()->syncWithoutDetaching($syncData);
        } elseif ($request->has('product_ids')) {
            $productIds = is_array($request->product_ids) ? $request->product_ids : json_decode($request->product_ids, true);
            $request->validate([
                'product_ids'   => 'required|array',
                'product_ids.*' => 'integer|exists:products,id',
            ]);
            $deal->products()->syncWithoutDetaching($productIds);
        } else {
            return response()->json(['detail' => 'products or product_ids field is required.'], 422);
        }

        $deal->load(['products' => function ($query) {
            $query->with(['translations', 'variants']);
        }]);

        return response()->json($deal);
    }

    /**
     * Update pivot attributes for a specific product inside the clearance sale.
     */
    public function updateProductPivot(Request $request, $id, $product_id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Not authorized.'], 403);
        }

        $deal = ClearanceSale::findOrFail($id);

        if ($user->role_id != 1 && $deal->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this clearance sale.'], 403);
        }

        $request->validate([
            'discount_amount' => 'sometimes|required|numeric|min:0',
            'discount_type'   => 'sometimes|required|string|in:flat,percent',
            'is_active'       => 'sometimes|required',
        ]);

        $pivotData = [];
        if ($request->has('discount_amount')) {
            $pivotData['discount_amount'] = $request->discount_amount;
        }
        if ($request->has('discount_type')) {
            $pivotData['discount_type'] = $request->discount_type;
        }
        if ($request->has('is_active')) {
            $pivotData['is_active'] = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
        }

        $deal->products()->updateExistingPivot($product_id, $pivotData);

        $deal->load(['products' => function ($query) {
            $query->with(['translations', 'variants']);
        }]);

        return response()->json($deal);
    }

    /**
     * Remove a product from a clearance sale.
     */
    public function removeProduct(Request $request, $id, $product_id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Not authorized.'], 403);
        }

        $deal = ClearanceSale::findOrFail($id);

        if ($user->role_id != 1 && $deal->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this clearance sale.'], 403);
        }

        $deal->products()->detach($product_id);

        $deal->load(['products' => function ($query) {
            $query->with(['translations', 'variants']);
        }]);

        return response()->json($deal);
    }
}
