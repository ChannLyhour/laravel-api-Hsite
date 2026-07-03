<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\DeliveryZone;
use Illuminate\Http\Request;

class DeliveryZoneController extends Controller
{
    /**
     * Public list of active delivery zones.
     */
    public function index(Request $request)
    {
        $createdBy = $request->query('created_by') ?? $request->query('owner_id');
        $query = DeliveryZone::where('is_active', true);

        if ($createdBy !== null) {
            $query->where('created_by', $createdBy);
        }

        return response()->json($query->orderBy('id', 'desc')->get());
    }

    /**
     * List of all delivery zones for the logged-in owner.
     */
    public function mine(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $query = DeliveryZone::query();

        if ($user->role_id != 1) {
            $query->where('created_by', $user->id);
        } else {
            $createdBy = $request->query('created_by') ?? $request->query('owner_id');
            if ($createdBy !== null) {
                $query->where('created_by', $createdBy);
            }
        }

        return response()->json($query->orderBy('id', 'desc')->get());
    }

    /**
     * Get a specific delivery zone.
     */
    public function show($id)
    {
        $zone = DeliveryZone::findOrFail($id);
        return response()->json($zone);
    }

    /**
     * Store a new delivery zone.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Forbidden'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|string|in:radius,polygon',
            'center_lat' => 'nullable|numeric|between:-90,90',
            'center_lng' => 'nullable|numeric|between:-180,180',
            'radius_km' => 'nullable|numeric|min:0',
            'delivery_fee' => 'required|numeric|min:0',
            'estimated_delivery_time' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $zone = DeliveryZone::create([
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'type' => $request->type ?? 'radius',
            'center_lat' => $request->center_lat,
            'center_lng' => $request->center_lng,
            'radius_km' => $request->radius_km,
            'polygon_coordinates' => $request->polygon_coordinates,
            'delivery_fee' => $request->delivery_fee,
            'estimated_delivery_time' => $request->estimated_delivery_time,
            'is_active' => $request->has('is_active') ? $request->is_active : true,
            'created_by' => $user->id,
        ]);

        return response()->json($zone, 201);
    }

    /**
     * Update an existing delivery zone.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Forbidden'], 403);
        }

        $zone = DeliveryZone::findOrFail($id);
        if ($user->role_id != 1 && $zone->created_by != $user->id) {
            return response()->json(['detail' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|string|in:radius,polygon',
            'center_lat' => 'nullable|numeric|between:-90,90',
            'center_lng' => 'nullable|numeric|between:-180,180',
            'radius_km' => 'nullable|numeric|min:0',
            'delivery_fee' => 'required|numeric|min:0',
            'estimated_delivery_time' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $zone->update([
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'type' => $request->type ?? $zone->type,
            'center_lat' => $request->center_lat,
            'center_lng' => $request->center_lng,
            'radius_km' => $request->radius_km,
            'polygon_coordinates' => $request->polygon_coordinates,
            'delivery_fee' => $request->delivery_fee,
            'estimated_delivery_time' => $request->estimated_delivery_time,
            'is_active' => $request->has('is_active') ? $request->is_active : $zone->is_active,
        ]);

        return response()->json($zone);
    }

    /**
     * Toggle the status of a delivery zone.
     */
    public function toggle(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Forbidden'], 403);
        }

        $zone = DeliveryZone::findOrFail($id);
        if ($user->role_id != 1 && $zone->created_by != $user->id) {
            return response()->json(['detail' => 'Unauthorized'], 403);
        }

        $zone->is_active = !$zone->is_active;
        $zone->save();

        return response()->json($zone);
    }

    /**
     * Delete a delivery zone.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Forbidden'], 403);
        }

        $zone = DeliveryZone::findOrFail($id);
        if ($user->role_id != 1 && $zone->created_by != $user->id) {
            return response()->json(['detail' => 'Unauthorized'], 403);
        }

        $zone->delete();

        return response()->json(['success' => true]);
    }
}
