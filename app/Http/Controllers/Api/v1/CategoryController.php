<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function store(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'boolean',
            'created_by' => 'nullable|integer|exists:users,id',
        ]);

        $category = Category::create([
            'name' => $request->name,
            'description' => $request->description,
            'status' => $request->status ?? true,
            'created_by' => $request->created_by ?? $request->user()->id,
        ]);

        return response()->json($category, 201);
    }

    public function index(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);
        $createdBy = $request->query('created_by');

        // Public lists only active categories (status=true)
        $query = Category::where('status', true);

        if ($createdBy !== null) {
            $query->where('created_by', $createdBy);
        }

        $categories = $query->skip($skip)->take($limit)->get();
        return response()->json($categories);
    }

    public function mine(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $user = $request->user();
        $query = Category::query();

        if ($user->role_id != 1) {
            $query->where('created_by', $user->id);
        }

        $categories = $query->skip($skip)->take($limit)->get();
        return response()->json($categories);
    }

    public function show($id)
    {
        $category = Category::findOrFail($id);
        return response()->json($category);
    }

    public function update(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $category = Category::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'boolean',
        ]);

        $category->update($request->only(['name', 'description', 'status']));
        return response()->json($category);
    }

    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json(['detail' => 'Category deleted successfully.']);
    }
}
