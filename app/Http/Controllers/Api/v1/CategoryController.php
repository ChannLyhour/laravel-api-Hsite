<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use App\Helpers\UploadHelper;

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
            'is_menu' => 'nullable|boolean',
            'created_by' => 'nullable|integer|exists:users,id',
            'parent_id' => 'nullable|integer|exists:categories,id',
            'priority' => 'nullable|integer',
            'image' => 'nullable',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = UploadHelper::uploadImage($request->file('image'), 'categories');
        } elseif ($request->has('image')) {
            $imagePath = $request->image;
        }

        $category = Category::create([
            'name' => $request->name,
            'description' => $request->description,
            'status' => $request->status ?? true,
            'is_menu' => $request->is_menu ?? true,
            'created_by' => $request->created_by ?? $request->user()->id,
            'parent_id' => $request->parent_id ?? null,
            'priority' => $request->priority ?? 0,
            'image' => $imagePath,
        ]);

        $category->load('parent.parent');

        return response()->json($category, 201);
    }

    public function index(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);
        $createdBy = $request->query('created_by');

        // Public lists only active categories (status=true)
        $query = Category::where('status', true)->with('parent.parent');

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
        $query = Category::with('parent.parent');

        if ($user->role_id != 1) {
            $query->where('created_by', $user->id);
        } else {
            $createdBy = $request->query('created_by');
            if ($createdBy !== null) {
                $query->where('created_by', $createdBy);
            }
        }

        $categories = $query->skip($skip)->take($limit)->get();
        return response()->json($categories);
    }

    public function show($id)
    {
        $category = Category::with('parent.parent')->findOrFail($id);
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
            'is_menu' => 'boolean',
            'parent_id' => 'nullable|integer|exists:categories,id',
            'priority' => 'nullable|integer',
            'image' => 'nullable',
        ]);

        $imagePath = $category->image;
        if ($request->hasFile('image')) {
            $imagePath = UploadHelper::updateImage($category->image, $request->file('image'), 'categories');
        } elseif ($request->has('image')) {
            $imagePath = $request->image;
        }

        $category->update([
            'name' => $request->name ?? $category->name,
            'description' => $request->has('description') ? $request->description : $category->description,
            'status' => $request->has('status') ? $request->status : $category->status,
            'is_menu' => $request->has('is_menu') ? $request->is_menu : $category->is_menu,
            'parent_id' => $request->has('parent_id') ? $request->parent_id : $category->parent_id,
            'priority' => $request->has('priority') ? $request->priority : $category->priority,
            'image' => $imagePath,
        ]);

        $category->load('parent.parent');
        return response()->json($category);
    }

    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $category = Category::findOrFail($id);

        if ($category->image) {
            UploadHelper::deleteImage($category->image);
        }

        $category->delete();

        return response()->json(['detail' => 'Category deleted successfully.']);
    }
}
