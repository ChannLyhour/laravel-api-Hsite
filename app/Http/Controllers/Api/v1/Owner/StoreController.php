<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function index(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are authorized to perform this operation.'], 403);
        }

        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $stores = Store::with('owner')->skip($skip)->take($limit)->get();
        return response()->json($stores);
    }

    public function showByOwner($ownerId)
    {
        $store = Store::where('created_by', $ownerId)->first();
        if (! $store) {
            return response()->json(['detail' => "Store not found for owner user with ID {$ownerId}"], 404);
        }
        return response()->json($store);
    }

    public function showMe(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied. Store owner or admin only.'], 403);
        }

        $store = Store::where('created_by', $user->id)->first();
        if (! $store) {
            return response()->json(['detail' => 'You do not have a store profile configured yet.'], 404);
        }
        return response()->json($store);
    }

    public function upsert(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied. Store owner or admin only.'], 403);
        }

        $request->validate([
            'store_name' => 'nullable|string|max:255',
            'store_phone' => 'nullable|string|max:50',
            'store_email' => 'nullable|string|email|max:255',
            'store_address' => 'nullable|string',
            'tax_percentage' => 'nullable|numeric',
            'subscription_tier' => 'nullable|string|max:255',
            'custom_domain' => 'nullable|string|max:255',
            'logo_url' => 'nullable|string',
            'social_tiktok' => 'nullable|string',
            'social_facebook' => 'nullable|string',
            'social_telegram' => 'nullable|string',
        ]);

        $store = Store::updateOrCreate(
            ['created_by' => $user->id],
            [
                'store_name' => $request->store_name,
                'store_phone' => $request->store_phone,
                'store_email' => $request->store_email,
                'store_address' => $request->store_address,
                'tax_percentage' => $request->tax_percentage,
                'subscription_tier' => $request->subscription_tier ?? 'free',
                'custom_domain' => $request->custom_domain,
                'logo_url' => $request->logo_url,
                'social_tiktok' => $request->social_tiktok,
                'social_facebook' => $request->social_facebook,
                'social_telegram' => $request->social_telegram,
            ]
        );

        return response()->json($store);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied. Only administrators can perform this operation.'], 403);
        }

        $request->validate([
            'created_by' => 'required|integer|exists:users,id',
            'store_name' => 'required|string|max:255',
            'store_phone' => 'nullable|string|max:50',
            'store_email' => 'nullable|string|email|max:255',
            'store_address' => 'nullable|string',
            'tax_percentage' => 'nullable|numeric',
            'subscription_tier' => 'nullable|string|max:255',
            'custom_domain' => 'nullable|string|max:255|unique:stores,custom_domain',
            'logo_url' => 'nullable|string',
            'social_tiktok' => 'nullable|string',
            'social_facebook' => 'nullable|string',
            'social_telegram' => 'nullable|string',
        ]);

        $store = Store::create([
            'created_by' => $request->created_by,
            'store_name' => $request->store_name,
            'store_phone' => $request->store_phone,
            'store_email' => $request->store_email,
            'store_address' => $request->store_address,
            'tax_percentage' => $request->tax_percentage ?? 10.0,
            'subscription_tier' => $request->subscription_tier ?? 'free',
            'custom_domain' => $request->custom_domain,
            'logo_url' => $request->logo_url,
            'social_tiktok' => $request->social_tiktok,
            'social_facebook' => $request->social_facebook,
            'social_telegram' => $request->social_telegram,
        ]);

        return response()->json($store, 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Access denied. Only administrators can perform this operation.'], 403);
        }

        $store = Store::findOrFail($id);

        $request->validate([
            'store_name' => 'nullable|string|max:255',
            'store_phone' => 'nullable|string|max:50',
            'store_email' => 'nullable|string|email|max:255',
            'store_address' => 'nullable|string',
            'tax_percentage' => 'nullable|numeric',
            'subscription_tier' => 'nullable|string|max:255',
            'custom_domain' => 'nullable|string|max:255|unique:stores,custom_domain,' . $store->id,
            'logo_url' => 'nullable|string',
            'social_tiktok' => 'nullable|string',
            'social_facebook' => 'nullable|string',
            'social_telegram' => 'nullable|string',
        ]);

        $store->update($request->only([
            'store_name',
            'store_phone',
            'store_email',
            'store_address',
            'tax_percentage',
            'subscription_tier',
            'custom_domain',
            'logo_url',
            'social_tiktok',
            'social_facebook',
            'social_telegram',
        ]));

        return response()->json($store);
    }
}
