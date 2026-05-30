<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MenuItemController extends Controller
{
    public function store(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric',
            'image' => 'nullable|image|max:2048',
            'image_url' => 'nullable|string',
            'status' => 'required|in:available,unavailable',
            'category_id' => 'nullable|integer|exists:categories,id',
        ]);

        $imagePath = $request->image_url;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('static/menu-items'), $filename);
            $imagePath = 'menu-items/' . $filename;
        }

        $item = MenuItem::create([
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'image' => $imagePath,
            'status' => $request->status,
            'category_id' => $request->category_id,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($item, 201);
    }

    public function index(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $user = $request->user();
        $query = MenuItem::query();

        if ($user && $user->role_id != 1) {
            $query->where('created_by', $user->id);
        }

        $items = $query->skip($skip)->take($limit)->get();
        return response()->json($items);
    }

    public function topSelling(Request $request)
    {
        $limit = $request->query('limit', 3);
        $createdBy = $request->query('created_by');

        $query = MenuItem::query();
        if ($createdBy !== null) {
            $query->where('created_by', $createdBy);
        }

        $items = $query->limit($limit)->get();
        return response()->json($items);
    }

    public function show($id)
    {
        $item = MenuItem::findOrFail($id);
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $item = MenuItem::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric',
            'image' => 'nullable|image|max:2048',
            'image_url' => 'nullable|string',
            'status' => 'sometimes|required|in:available,unavailable',
            'category_id' => 'nullable|integer|exists:categories,id',
        ]);

        $imagePath = $request->has('image_url') ? $request->image_url : $item->image;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('static/menu-items'), $filename);
            $imagePath = 'menu-items/' . $filename;
        }

        $item->update([
            'name' => $request->name ?? $item->name,
            'description' => $request->description ?? $item->description,
            'price' => $request->price ?? $item->price,
            'image' => $imagePath,
            'status' => $request->status ?? $item->status,
            'category_id' => $request->has('category_id') ? $request->category_id : $item->category_id,
        ]);

        return response()->json($item);
    }

    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $item = MenuItem::findOrFail($id);
        $item->delete();

        return response()->json(['detail' => 'Menu item deleted successfully.']);
    }
}
