<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\ProductBadge;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductBadgeController extends Controller
{
    public function index(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);
        $createdBy = $request->query('created_by');

        $query = ProductBadge::where('status', true)->withCount('products');

        if ($createdBy !== null) {
            $query->where('created_by', $createdBy);
        }

        $badges = $query->orderBy('priority', 'desc')->orderBy('id', 'desc')->skip($skip)->take($limit)->get();
        return response()->json($badges);
    }

    public function mine(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $user = $request->user();
        $query = ProductBadge::query()->withCount('products');

        if ($user->role_id != 1) {
            $query->where('created_by', $user->id);
        } else {
            $createdBy = $request->query('created_by');
            if ($createdBy !== null) {
                $query->where('created_by', $createdBy);
            }
        }

        $badges = $query->orderBy('priority', 'desc')->orderBy('id', 'desc')->skip($skip)->take($limit)->get();
        return response()->json($badges);
    }

    public function show($id)
    {
        $badge = ProductBadge::withCount('products')->findOrFail($id);
        return response()->json($badge);
    }

    public function store(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255|unique:product_badges,name',
            'slug' => 'nullable|string|max:255|unique:product_badges,slug',
            'text_color' => 'nullable|string|max:255',
            'background_color' => 'nullable|string|max:255',
            'status' => 'boolean',
            'priority' => 'nullable|integer',
            'created_by' => 'nullable|integer|exists:users,id',
        ]);

        $slug = $request->slug ? Str::slug($request->slug) : Str::slug($request->name);

        // Ensure unique slug if auto-generated
        $originalSlug = $slug;
        $count = 1;
        while (ProductBadge::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count;
            $count++;
        }

        $badge = ProductBadge::create([
            'name' => $request->name,
            'slug' => $slug,
            'text_color' => $request->text_color,
            'background_color' => $request->background_color,
            'status' => $request->status ?? true,
            'priority' => $request->priority ?? 0,
            'created_by' => $request->created_by ?? $request->user()->id,
        ]);

        return response()->json($badge, 201);
    }

    public function update(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $badge = ProductBadge::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:product_badges,name,' . $badge->id,
            'slug' => 'sometimes|required|string|max:255|unique:product_badges,slug,' . $badge->id,
            'text_color' => 'nullable|string|max:255',
            'background_color' => 'nullable|string|max:255',
            'status' => 'boolean',
            'priority' => 'nullable|integer',
        ]);

        $badge->update([
            'name' => $request->name ?? $badge->name,
            'slug' => $request->slug ? Str::slug($request->slug) : $badge->slug,
            'text_color' => $request->has('text_color') ? $request->text_color : $badge->text_color,
            'background_color' => $request->has('background_color') ? $request->background_color : $badge->background_color,
            'status' => $request->has('status') ? $request->status : $badge->status,
            'priority' => $request->has('priority') ? $request->priority : $badge->priority,
        ]);

        return response()->json($badge);
    }

    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $badge = ProductBadge::findOrFail($id);
        $badge->delete();

        return response()->json(['detail' => 'Product badge deleted successfully.']);
    }
}
