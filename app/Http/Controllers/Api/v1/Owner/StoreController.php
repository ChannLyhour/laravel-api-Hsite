<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()->role_id != 1) {
            return response()->json(['detail' => 'Only administrators are authorized to perform this operation.'], 403);
        }

        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $stores = Store::skip($skip)->take($limit)->get();
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
                'logo_url' => $request->logo_url,
                'social_tiktok' => $request->social_tiktok,
                'social_facebook' => $request->social_facebook,
                'social_telegram' => $request->social_telegram,
            ]
        );

        return response()->json($store);
    }
}
