<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()->role_id !== 1) {
            return response()->json(['detail' => 'Only administrators are authorized to perform this operation.'], 403);
        }

        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $stores = Store::all()->groupBy('created_by');
        $formatted = [];
        foreach ($stores as $ownerId => $items) {
            $dict = [
                'id' => $ownerId,
                'owner_id' => $ownerId,
                'created_by' => $ownerId,
            ];
            foreach ($items as $item) {
                $dict[$item->key] = $item->value;
            }
            $owner = \App\Models\User::find($ownerId);
            if ($owner) {
                $dict['owner'] = $owner;
            }
            $formatted[] = $dict;
        }

        $formatted = array_slice($formatted, $skip, $limit);
        return response()->json($formatted);
    }

    public function showByOwner($ownerId)
    {
        $storeSettings = Store::where('created_by', $ownerId)->get();
        if ($storeSettings->isEmpty()) {
            return response()->json(['detail' => "Store not found for owner user with ID {$ownerId}"], 404);
        }
        $dict = [
            'id' => intval($ownerId),
            'owner_id' => intval($ownerId),
            'created_by' => intval($ownerId),
        ];
        foreach ($storeSettings as $item) {
            $dict[$item->key] = $item->value;
        }
        return response()->json($dict);
    }

    public function showMe(Request $request)
    {
        $user = $request->user();
        if ($user->role_id !== 30003) {
            return response()->json(['detail' => 'Access denied. Store owner only.'], 403);
        }

        $storeSettings = Store::where('created_by', $user->id)->get();
        if ($storeSettings->isEmpty()) {
            return response()->json(['detail' => 'You do not have a store profile configured yet.'], 404);
        }
        $dict = [
            'id' => $user->id,
            'owner_id' => $user->id,
            'created_by' => $user->id,
        ];
        foreach ($storeSettings as $item) {
            $dict[$item->key] = $item->value;
        }
        return response()->json($dict);
    }

    public function upsert(Request $request)
    {
        $user = $request->user();
        if ($user->role_id !== 30003) {
            return response()->json(['detail' => 'Access denied. Store owner only.'], 403);
        }

        $data = $request->all();
        foreach ($data as $key => $value) {
            if (in_array($key, ['id', 'created_by', 'owner_id', 'owner', 'created_at', 'updated_at'])) {
                continue;
            }
            Store::updateOrCreate(
                ['created_by' => $user->id, 'key' => $key],
                ['value' => $value]
            );
        }

        // Clear cached settings for owner
        \Illuminate\Support\Facades\Cache::forget("settings_owner_{$user->id}");

        $storeSettings = Store::where('created_by', $user->id)->get();
        $dict = [
            'id' => $user->id,
            'owner_id' => $user->id,
            'created_by' => $user->id,
        ];
        foreach ($storeSettings as $item) {
            $dict[$item->key] = $item->value;
        }
        return response()->json($dict);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role_id !== 1) {
            return response()->json(['detail' => 'Access denied. Only administrators can perform this operation.'], 403);
        }

        $request->validate([
            'created_by' => 'required|integer|exists:users,id',
        ]);

        $ownerId = $request->created_by;
        $data = $request->all();
        foreach ($data as $key => $value) {
            if (in_array($key, ['id', 'created_by', 'owner_id', 'owner', 'created_at', 'updated_at'])) {
                continue;
            }
            Store::updateOrCreate(
                ['created_by' => $ownerId, 'key' => $key],
                ['value' => $value]
            );
        }

        // Clear cached settings for owner
        \Illuminate\Support\Facades\Cache::forget("settings_owner_{$ownerId}");

        $storeSettings = Store::where('created_by', $ownerId)->get();
        $dict = [
            'id' => $ownerId,
            'owner_id' => $ownerId,
            'created_by' => $ownerId,
        ];
        foreach ($storeSettings as $item) {
            $dict[$item->key] = $item->value;
        }
        return response()->json($dict, 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role_id !== 1) {
            return response()->json(['detail' => 'Access denied. Only administrators can perform this operation.'], 403);
        }

        $ownerId = $id;
        $storeSettingsExists = Store::where('created_by', $ownerId)->exists();
        if (!$storeSettingsExists) {
            $single = Store::find($id);
            if ($single) {
                $ownerId = $single->created_by;
            } else {
                return response()->json(['detail' => 'Store profile not found.'], 404);
            }
        }

        $data = $request->all();
        foreach ($data as $key => $value) {
            if (in_array($key, ['id', 'created_by', 'owner_id', 'owner', 'created_at', 'updated_at'])) {
                continue;
            }
            Store::updateOrCreate(
                ['created_by' => $ownerId, 'key' => $key],
                ['value' => $value]
            );
        }

        // Clear cached settings for owner
        \Illuminate\Support\Facades\Cache::forget("settings_owner_{$ownerId}");

        $storeSettings = Store::where('created_by', $ownerId)->get();
        $dict = [
            'id' => $ownerId,
            'owner_id' => $ownerId,
            'created_by' => $ownerId,
        ];
        foreach ($storeSettings as $item) {
            $dict[$item->key] = $item->value;
        }
        return response()->json($dict);
    }
}
