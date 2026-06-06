<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    /**
     * Public list of vendors (users with role_id = 2 — Seller).
     */
    public function index(Request $request)
    {
        $skip  = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $vendors = User::where('role_id', 2)
            ->select('id', 'name', 'first_name', 'last_name', 'gender', 'email', 'phone', 'city', 'country', 'state', 'image')
            ->skip($skip)
            ->take($limit)
            ->get();

        return response()->json($vendors);
    }

    /**
     * Show a single vendor by ID.
     */
    public function show($id)
    {
        $vendor = User::where('role_id', 2)
            ->select('id', 'name', 'first_name', 'last_name', 'gender', 'email', 'phone', 'city', 'country', 'state', 'image')
            ->findOrFail($id);

        return response()->json($vendor);
    }
}
