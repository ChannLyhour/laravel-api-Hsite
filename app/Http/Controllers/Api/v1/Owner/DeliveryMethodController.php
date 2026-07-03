<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\DeliveryMethod;
use Illuminate\Http\Request;
use App\Helpers\UploadHelper;

class DeliveryMethodController extends Controller
{
    /**
     * Public list of active delivery methods.
     */
    public function index(Request $request)
    {
        $createdBy = $request->query('created_by') ?? $request->query('owner_id');
        $query = DeliveryMethod::where('is_active', true);

        if ($createdBy !== null) {
            $query->where('created_by', $createdBy);
        }

        return response()->json($query->orderBy('id', 'desc')->get());
    }

    /**
     * List of all delivery methods for the logged-in owner.
     */
    public function mine(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $query = DeliveryMethod::query();

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
     * Get a specific delivery method.
     */
    public function show($id)
    {
        $method = DeliveryMethod::findOrFail($id);
        return response()->json($method);
    }

    /**
     * Create a new delivery method.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:100',
            'description' => 'nullable|string',
            'cost' => 'required|numeric|min:0',
            'estimated_days_min' => 'required|integer|min:0',
            'estimated_days_max' => 'required|integer|min:0|gte:estimated_days_min',
            'is_active' => 'boolean',
            'image' => 'nullable', // Can be file upload or string/URL
            'created_by' => 'nullable|integer|exists:users,id',
            'delivery_zone_id' => 'nullable|integer|exists:delivery_zones,id',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = UploadHelper::uploadImage($request->file('image'), 'delivery_methods');
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

        $deliveryZoneId = $request->delivery_zone_id;
        if ($deliveryZoneId === 'null' || $deliveryZoneId === '') {
            $deliveryZoneId = null;
        }

        $method = DeliveryMethod::create([
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'cost' => $request->cost,
            'estimated_days_min' => $request->estimated_days_min,
            'estimated_days_max' => $request->estimated_days_max,
            'is_active' => $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : true,
            'image' => $imagePath,
            'created_by' => $request->created_by ?? $user->id,
            'delivery_zone_id' => $deliveryZoneId,
        ]);

        return response()->json($method, 201);
    }

    /**
     * Update an existing delivery method.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $method = DeliveryMethod::findOrFail($id);
        
        // Authorization check: non-admin owners can only edit their own
        if ($user->role_id != 1 && $method->created_by != $user->id) {
            return response()->json(['detail' => 'You are not authorized to update this delivery method.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:100',
            'description' => 'nullable|string',
            'cost' => 'required|numeric|min:0',
            'estimated_days_min' => 'required|integer|min:0',
            'estimated_days_max' => 'required|integer|min:0|gte:estimated_days_min',
            'is_active' => 'boolean',
            'image' => 'nullable', // Can be file upload, string/URL, or null
            'delivery_zone_id' => 'nullable|integer|exists:delivery_zones,id',
        ]);

        $imagePath = $method->image;
        if ($request->hasFile('image')) {
            // Delete old file if exists
            if ($method->image && file_exists(public_path($method->image))) {
                @unlink(public_path($method->image));
            }
            $imagePath = UploadHelper::uploadImage($request->file('image'), 'delivery_methods');
        } elseif ($request->has('image') && is_string($request->image)) {
            $imagePath = $request->image;
        }

        // Clean domain URL prefix if present
        if ($imagePath && (str_starts_with($imagePath, 'http://') || str_starts_with($imagePath, 'https://'))) {
            $baseUrl = url('/');
            if (str_starts_with($imagePath, $baseUrl)) {
                $imagePath = ltrim(substr($imagePath, strlen($baseUrl)), '/');
            }
        }

        $deliveryZoneId = $request->delivery_zone_id;
        if ($deliveryZoneId === 'null' || $deliveryZoneId === '') {
            $deliveryZoneId = null;
        }

        $method->update([
            'name' => $request->name,
            'code' => $request->code,
            'description' => $request->description,
            'cost' => $request->cost,
            'estimated_days_min' => $request->estimated_days_min,
            'estimated_days_max' => $request->estimated_days_max,
            'is_active' => $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : $method->is_active,
            'image' => $imagePath,
            'delivery_zone_id' => $deliveryZoneId,
        ]);

        return response()->json($method);
    }

    /**
     * Toggle status.
     */
    public function toggle(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $method = DeliveryMethod::findOrFail($id);

        if ($user->role_id != 1 && $method->created_by != $user->id) {
            return response()->json(['detail' => 'You are not authorized to toggle this delivery method.'], 403);
        }

        $method->update([
            'is_active' => !$method->is_active,
        ]);

        return response()->json($method);
    }

    /**
     * Delete a delivery method.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $method = DeliveryMethod::findOrFail($id);

        if ($user->role_id != 1 && $method->created_by != $user->id) {
            return response()->json(['detail' => 'You are not authorized to delete this delivery method.'], 403);
        }

        // Delete image if exists
        if ($method->image && file_exists(public_path($method->image))) {
            @unlink(public_path($method->image));
        }

        $method->delete();

        return response()->json(['detail' => 'Delivery method deleted successfully.']);
    }
}
