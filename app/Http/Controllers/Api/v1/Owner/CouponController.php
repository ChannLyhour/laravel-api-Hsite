<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CouponController extends Controller
{
    /**
     * Public list of active coupons.
     * Supports filters: vendor_id, customer_id, coupon_type
     */
    public function index(Request $request)
    {
        $skip     = $request->query('skip', 0);
        $limit    = $request->query('limit', 100);

        $query = Coupon::where('is_active', true)
            ->with(['vendor:id,name', 'customer:id,name']);

        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->query('vendor_id'));
        }
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->query('customer_id'));
        }
        if ($request->filled('coupon_type')) {
            $query->where('coupon_type', $request->query('coupon_type'));
        }

        $coupons = $query->orderBy('id', 'desc')->skip($skip)->take($limit)->get();

        return response()->json($coupons);
    }

    /**
     * List all coupons created by the logged-in user (admin sees all).
     */
    public function mine(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Not authorized.'], 403);
        }

        $skip  = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $query = Coupon::with(['vendor:id,name', 'customer:id,name', 'creator:id,name']);

        if ($user->role_id != 1) {
            $query->where('created_by', $user->id);
        } else {
            if ($request->filled('created_by')) {
                $query->where('created_by', $request->query('created_by'));
            }
        }

        $coupons = $query->orderBy('id', 'desc')->skip($skip)->take($limit)->get();

        return response()->json($coupons);
    }

    /**
     * Show a single coupon by ID (public).
     */
    public function show($id)
    {
        $coupon = Coupon::with(['vendor:id,name', 'customer:id,name', 'creator:id,name'])
            ->findOrFail($id);

        return response()->json($coupon);
    }

    /**
     * Validate a coupon code (public).
     * GET /coupons/validate?code=XYZ
     */
    public function validateCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $coupon = Coupon::where('code', strtoupper($request->query('code')))
            ->where('is_active', true)
            ->first();

        if (! $coupon) {
            return response()->json(['detail' => 'Invalid or inactive coupon code.'], 404);
        }

        $today = now()->toDateString();

        if ($coupon->start_date->toDateString() > $today) {
            return response()->json(['detail' => 'Coupon is not yet active.'], 422);
        }

        if ($coupon->expire_date->toDateString() < $today) {
            return response()->json(['detail' => 'Coupon has expired.'], 422);
        }

        if ($coupon->limit_same_user) {
            $user = $request->user() ?? auth('sanctum')->user();
            if ($user) {
                $usedCount = \App\Models\Order::where('user_id', $user->id)
                    ->where('coupon_code', $coupon->code)
                    ->where('status', '!=', 'canceled')
                    ->count();
                if ($usedCount >= $coupon->limit_same_user) {
                    return response()->json(['detail' => 'You have reached the usage limit for this coupon.'], 422);
                }
            }
        }

        return response()->json($coupon);
    }

    /**
     * Create a new coupon (auth).
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $data = $request->validate([
            'title'            => 'required|string|max:255',
            'code'             => 'nullable|string|max:100|unique:coupons,code',
            'coupon_type'      => 'required|string|in:first_order,discount_on_purchase,free_delivery',
            'vendor_id'        => 'nullable|integer|exists:users,id',
            'customer_id'      => 'nullable|integer|exists:customers,id',
            'discount_type'    => 'required|string|in:amount,percentage',
            'discount_amount'  => 'required|numeric|min:0',
            'minimum_purchase' => 'nullable|numeric|min:0',
            'limit_same_user'  => 'nullable|integer|min:1',
            'start_date'       => 'required|date',
            'expire_date'      => 'required|date|after_or_equal:start_date',
            'is_active'        => 'nullable|boolean',
        ]);

        // Auto-generate code if not provided
        $data['code'] = strtoupper($data['code'] ?? Str::random(10));
        $data['created_by'] = $user->id;
        $data['total_used'] = 0;
        $data['is_active'] = $request->has('is_active')
            ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN)
            : true;

        $coupon = Coupon::create($data);
        $coupon->load(['vendor:id,name', 'customer:id,name', 'creator:id,name']);

        return response()->json($coupon, 201);
    }

    /**
     * Update an existing coupon (auth).
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $coupon = Coupon::findOrFail($id);

        if ($user->role_id != 1 && $coupon->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this coupon.'], 403);
        }

        $data = $request->validate([
            'title'            => 'sometimes|required|string|max:255',
            'code'             => 'sometimes|required|string|max:100|unique:coupons,code,' . $id,
            'coupon_type'      => 'sometimes|required|string|in:first_order,discount_on_purchase,free_delivery',
            'vendor_id'        => 'nullable|integer|exists:users,id',
            'customer_id'      => 'nullable|integer|exists:customers,id',
            'discount_type'    => 'sometimes|required|string|in:amount,percentage',
            'discount_amount'  => 'sometimes|required|numeric|min:0',
            'minimum_purchase' => 'nullable|numeric|min:0',
            'limit_same_user'  => 'nullable|integer|min:1',
            'start_date'       => 'sometimes|required|date',
            'expire_date'      => 'sometimes|required|date|after_or_equal:start_date',
            'is_active'        => 'nullable|boolean',
        ]);

        if (isset($data['code'])) {
            $data['code'] = strtoupper($data['code']);
        }

        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
        }

        $coupon->update($data);
        $coupon->load(['vendor:id,name', 'customer:id,name', 'creator:id,name']);

        return response()->json($coupon);
    }

    /**
     * Toggle active/inactive status.
     */
    public function toggle(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Not authorized.'], 403);
        }

        $coupon = Coupon::findOrFail($id);

        if ($user->role_id != 1 && $coupon->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this coupon.'], 403);
        }

        $coupon->update(['is_active' => ! $coupon->is_active]);

        return response()->json($coupon);
    }

    /**
     * Delete a coupon (auth).
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);;
        }

        $coupon = Coupon::findOrFail($id);

        if ($user->role_id != 1 && $coupon->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this coupon.'], 403);
        }

        $coupon->delete();

        return response()->json(['detail' => 'Coupon deleted successfully.']);
    }
}
