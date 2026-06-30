<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use App\Helpers\UploadHelper;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);
        $createdBy = $request->get('current_store_owner_id') ?? $request->query('created_by');

        $query = Brand::where('status', true)->withCount('products');

        if ($createdBy !== null) {
            $query->where('created_by', $createdBy);
        }

        $brands = $query->skip($skip)->take($limit)->get()->map(function ($brand) {
            $brand->total_product = $brand->products_count;
            return $brand;
        });
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
        $query = Brand::query()->withCount('products');

        if ($user->role_id != 1) {
            $query->where('created_by', $user->id);
        } else {
            $createdBy = $request->query('created_by');
            if ($createdBy !== null) {
                $query->where('created_by', $createdBy);
            }
        }

        $brands = $query->skip($skip)->take($limit)->get()->map(function ($brand) {
            $brand->total_product = $brand->products_count;
            return $brand;
        });
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
            'logo' => 'nullable',
            'alt_text' => 'nullable|string',
            'status' => 'boolean',
            'created_by' => 'nullable|integer|exists:users,id',
        ]);

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = UploadHelper::uploadImage($request->file('logo'), 'brands');
        } elseif ($request->has('logo')) {
            $logoPath = $request->logo;
        }

        $logoPath = UploadHelper::normalizePath($logoPath);

        $brand = Brand::create([
            'name' => $request->name,
            'logo' => $logoPath,
            'alt_text' => $request->alt_text,
            'total_product' => 0,
            'total_order' => 0,
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
            'logo' => 'nullable',
            'alt_text' => 'nullable|string',
            'status' => 'boolean',
        ]);

        $logoPath = $brand->logo;
        if ($request->hasFile('logo')) {
            $logoPath = UploadHelper::updateImage($brand->logo, $request->file('logo'), 'brands');
        } elseif ($request->has('logo')) {
            $logoPath = $request->logo;
        }

        $logoPath = UploadHelper::normalizePath($logoPath);

        $brand->update([
            'name' => $request->name ?? $brand->name,
            'logo' => $logoPath,
            'alt_text' => $request->has('alt_text') ? $request->alt_text : $brand->alt_text,
            'status' => $request->has('status') ? $request->status : $brand->status,
        ]);

        return response()->json($brand);
    }

    public function uploadLogo(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Access denied.'], 403);
        }

        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            $path = UploadHelper::uploadImage($request->file('logo'), 'brands');
            return response()->json([
                'url' => asset($path),
                'path' => $path
            ]);
        }

        return response()->json(['detail' => 'No file provided.'], 400);
    }

    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $brand = Brand::findOrFail($id);

        // Optional: Delete logo file when brand is deleted
        if ($brand->logo) {
            UploadHelper::deleteImage($brand->logo);
        }

        $brand->delete();

        return response()->json(['detail' => 'Brand deleted successfully.']);
    }
}
