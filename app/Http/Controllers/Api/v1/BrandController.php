<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);
        $createdBy = $request->query('created_by');

        $query = Brand::where('status', true);

        if ($createdBy !== null) {
            $query->where('created_by', $createdBy);
        }

        $brands = $query->skip($skip)->take($limit)->get();
        return response()->json($brands);
    }

    public function mine(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $user = $request->user();
        $query = Brand::query();

        if ($user->role_id != 1) {
            $query->where('created_by', $user->id);
        } else {
            $createdBy = $request->query('created_by');
            if ($createdBy !== null) {
                $query->where('created_by', $createdBy);
            }
        }

        $brands = $query->skip($skip)->take($limit)->get();
        return response()->json($brands);
    }

    public function show($id)
    {
        $brand = Brand::findOrFail($id);
        return response()->json($brand);
    }

    public function store(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:100|unique:brands,name',
            'logo' => 'nullable|string',
            'status' => 'boolean',
            'created_by' => 'nullable|integer|exists:users,id',
        ]);

        $brand = Brand::create([
            'name' => $request->name,
            'logo' => $request->logo,
            'status' => $request->status ?? true,
            'created_by' => $request->created_by ?? $request->user()->id,
        ]);

        return response()->json($brand, 201);
    }

    public function update(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $brand = Brand::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:100|unique:brands,name,' . $brand->id,
            'logo' => 'nullable|string',
            'status' => 'boolean',
        ]);

        $brand->update([
            'name' => $request->name ?? $brand->name,
            'logo' => $request->has('logo') ? $request->logo : $brand->logo,
            'status' => $request->has('status') ? $request->status : $brand->status,
        ]);

        return response()->json($brand);
    }

    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $brand = Brand::findOrFail($id);
        $brand->delete();

        return response()->json(['detail' => 'Brand deleted successfully.']);
    }
}
