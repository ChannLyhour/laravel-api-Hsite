<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\FoodItem;
use Illuminate\Http\Request;

class FoodItemController extends Controller
{
    public function store(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'price' => 'required|numeric',
            'category' => 'required|string|max:50',
            'is_available' => 'nullable|boolean',
        ]);

        $item = FoodItem::create([
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'category' => $request->category,
            'is_available' => $request->is_available ?? true,
        ]);

        return response()->json($item, 201);
    }

    public function index(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $items = FoodItem::skip($skip)->take($limit)->get();
        return response()->json($items);
    }

    public function show($id)
    {
        $item = FoodItem::findOrFail($id);
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $item = FoodItem::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:255',
            'price' => 'sometimes|required|numeric',
            'category' => 'sometimes|required|string|max:50',
            'is_available' => 'nullable|boolean',
        ]);

        $item->update($request->only(['name', 'description', 'price', 'category', 'is_available']));
        return response()->json($item);
    }

    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $item = FoodItem::findOrFail($id);
        $item->delete();

        return response()->json(['detail' => 'Food item deleted successfully.']);
    }
}
