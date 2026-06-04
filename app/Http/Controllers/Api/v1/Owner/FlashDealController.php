<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\FlashDeal;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Helpers\UploadHelper;

class FlashDealController extends Controller
{
    /**
     * Public list of active and published flash deals.
     */
    public function index(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $deals = FlashDeal::where('is_published', true)
            ->with(['products' => function ($query) {
                $query->with(['translations', 'variants']);
            }])
            ->orderBy('id', 'desc')
            ->skip($skip)
            ->take($limit)
            ->get();

        return response()->json($deals);
    }

    /**
     * List all flash deals for the logged-in user.
     */
    public function mine(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Not authorized.'], 403);
        }

        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $query = FlashDeal::with(['products' => function ($query) {
            $query->with(['translations', 'variants']);
        }]);

        if ($user->role_id != 1) {
            $query->where('created_by', $user->id);
        }

        $deals = $query->orderBy('id', 'desc')->skip($skip)->take($limit)->get();

        return response()->json($deals);
    }

    /**
     * Show details of a specific flash deal.
     */
    public function show($id)
    {
        $deal = FlashDeal::with(['products' => function ($query) {
            $query->with(['translations', 'variants']);
        }])->findOrFail($id);

        return response()->json($deal);
    }

    /**
     * Create a new flash deal.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $data = $request->validate([
            'title'            => 'required|string|max:255',
            'start_date'       => 'required|date',
            'end_date'         => 'required|date|after_or_equal:start_date',
            'image'            => 'nullable', // Can be file upload, URL or base64
            'meta_title'       => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'meta_image'       => 'nullable',
            'is_published'     => 'nullable',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = UploadHelper::uploadImage($request->file('image'), 'flash-deals');
        } elseif (is_string($request->image)) {
            $imagePath = $request->image;
        }

        // Clean domain URL prefix if present
        if ($imagePath && (str_starts_with($imagePath, 'http://') || str_starts_with($imagePath, 'https://'))) {
            $baseUrl = url('/');
            if (str_starts_with($imagePath, $baseUrl)) {
                $imagePath = ltrim(substr($imagePath, strlen($baseUrl)), '/');
            }
        }

        $metaImagePath = null;
        if ($request->hasFile('meta_image')) {
            $metaImagePath = UploadHelper::uploadImage($request->file('meta_image'), 'flash-deals/meta');
        } elseif (is_string($request->meta_image)) {
            $metaImagePath = $request->meta_image;
        }

        if ($metaImagePath && (str_starts_with($metaImagePath, 'http://') || str_starts_with($metaImagePath, 'https://'))) {
            $baseUrl = url('/');
            if (str_starts_with($metaImagePath, $baseUrl)) {
                $metaImagePath = ltrim(substr($metaImagePath, strlen($baseUrl)), '/');
            }
        }

        $deal = FlashDeal::create([
            'title'            => $data['title'],
            'start_date'       => $data['start_date'],
            'end_date'         => $data['end_date'],
            'image'            => $imagePath,
            'meta_title'       => $data['meta_title'] ?? null,
            'meta_description' => $data['meta_description'] ?? null,
            'meta_image'       => $metaImagePath,
            'is_published'     => $request->has('is_published') ? filter_var($request->is_published, FILTER_VALIDATE_BOOLEAN) : false,
            'created_by'       => $user->id,
        ]);

        if ($request->has('product_ids')) {
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
     * Update an existing flash deal.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $deal = FlashDeal::findOrFail($id);

        if ($user->role_id != 1 && $deal->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this flash deal.'], 403);
        }

        $data = $request->validate([
            'title'            => 'sometimes|required|string|max:255',
            'start_date'       => 'sometimes|required|date',
            'end_date'         => 'sometimes|required|date|after_or_equal:start_date',
            'image'            => 'nullable',
            'meta_title'       => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'meta_image'       => 'nullable',
            'is_published'     => 'nullable',
        ]);

        $imagePath = $deal->getRawOriginal('image');
        if ($request->hasFile('image')) {
            if ($imagePath) {
                UploadHelper::deleteImage($imagePath);
            }
            $imagePath = UploadHelper::uploadImage($request->file('image'), 'flash-deals');
        } elseif ($request->has('image') && is_string($request->image)) {
            $imagePath = $request->image;
        }

        if ($imagePath && (str_starts_with($imagePath, 'http://') || str_starts_with($imagePath, 'https://'))) {
            $baseUrl = url('/');
            if (str_starts_with($imagePath, $baseUrl)) {
                $imagePath = ltrim(substr($imagePath, strlen($baseUrl)), '/');
            }
        }

        $metaImagePath = $deal->getRawOriginal('meta_image');
        if ($request->hasFile('meta_image')) {
            if ($metaImagePath) {
                UploadHelper::deleteImage($metaImagePath);
            }
            $metaImagePath = UploadHelper::uploadImage($request->file('meta_image'), 'flash-deals/meta');
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
        if (isset($data['start_date'])) {
            $updateData['start_date'] = $data['start_date'];
        }
        if (isset($data['end_date'])) {
            $updateData['end_date'] = $data['end_date'];
        }
        if ($request->has('image')) {
            $updateData['image'] = $imagePath;
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
        if ($request->has('is_published')) {
            $updateData['is_published'] = filter_var($request->is_published, FILTER_VALIDATE_BOOLEAN);
        }

        $deal->update($updateData);

        if ($request->has('product_ids')) {
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
     * Toggle the published status of the flash deal.
     */
    public function toggle(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Not authorized.'], 403);
        }

        $deal = FlashDeal::findOrFail($id);

        if ($user->role_id != 1 && $deal->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this flash deal.'], 403);
        }

        $deal->update([
            'is_published' => ! $deal->is_published
        ]);

        return response()->json($deal);
    }

    /**
     * Delete a flash deal.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $deal = FlashDeal::findOrFail($id);

        if ($user->role_id != 1 && $deal->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this flash deal.'], 403);
        }

        $imagePath = $deal->getRawOriginal('image');
        if ($imagePath) {
            UploadHelper::deleteImage($imagePath);
        }

        $metaImagePath = $deal->getRawOriginal('meta_image');
        if ($metaImagePath) {
            UploadHelper::deleteImage($metaImagePath);
        }

        $deal->delete();

        return response()->json(['detail' => 'Flash deal deleted successfully.']);
    }

    /**
     * Associate products to a flash deal.
     */
    public function addProducts(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Not authorized.'], 403);
        }

        $deal = FlashDeal::findOrFail($id);

        if ($user->role_id != 1 && $deal->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this flash deal.'], 403);
        }

        $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'integer|exists:products,id',
        ]);

        $deal->products()->syncWithoutDetaching($request->product_ids);

        $deal->load(['products' => function ($query) {
            $query->with(['translations', 'variants']);
        }]);

        return response()->json($deal);
    }

    /**
     * Remove a product from a flash deal.
     */
    public function removeProduct(Request $request, $id, $product_id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Not authorized.'], 403);
        }

        $deal = FlashDeal::findOrFail($id);

        if ($user->role_id != 1 && $deal->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this flash deal.'], 403);
        }

        $deal->products()->detach($product_id);

        $deal->load(['products' => function ($query) {
            $query->with(['translations', 'variants']);
        }]);

        return response()->json($deal);
    }
}
