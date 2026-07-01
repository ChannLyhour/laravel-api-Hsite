<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\StorePage;
use Illuminate\Http\Request;
use Vinkla\Hashids\Facades\Hashids;

class PageController extends Controller
{
    /**
     * Public endpoint: Retrieve a published store page by owner_id and slug.
     */
    public function getPublicPage(Request $request)
    {
        $ownerId = $request->query('owner_id');
        $slug = $request->query('slug', 'home');

        if (!$ownerId) {
            return response()->json([
                'success' => false,
                'message' => 'owner_id query parameter is required.'
            ], 400);
        }

        $realOwnerId = $ownerId;
        if (!is_numeric($realOwnerId)) {
            $decoded = Hashids::decode($ownerId);
            $realOwnerId = !empty($decoded) ? $decoded[0] : null;
        }

        if (!$realOwnerId) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid owner_id.'
            ], 400);
        }

        $page = StorePage::where('owner_id', $realOwnerId)
            ->where('slug', $slug)
            ->where('is_published', true)
            ->first();

        if (!$page) {
            return response()->json([
                'success' => false,
                'message' => 'Page not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $page
        ]);
    }

    /**
     * Authenticated endpoint: List all custom pages for the store owner.
     */
    public function index(Request $request)
    {
        $pages = StorePage::where('owner_id', $request->user()->id)->get();
        return response()->json([
            'success' => true,
            'data' => $pages
        ]);
    }

    /**
     * Authenticated endpoint: Create or update a custom page.
     */
    public function store(Request $request)
    {
        $request->validate([
            'slug' => 'required|string|max:100',
            'title' => 'required|string|max:255',
            'content_json' => 'nullable|array',
            'is_published' => 'nullable|boolean',
        ]);

        $page = StorePage::updateOrCreate(
            [
                'owner_id' => $request->user()->id,
                'slug' => strtolower($request->input('slug')),
            ],
            [
                'title' => $request->input('title'),
                'content_json' => $request->input('content_json') ?: [],
                'is_published' => $request->input('is_published', true),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Page saved successfully.',
            'data' => $page
        ]);
    }

    /**
     * Authenticated endpoint: Delete a page.
     */
    public function destroy(Request $request, $id)
    {
        $page = StorePage::where('owner_id', $request->user()->id)->find($id);

        if (!$page) {
            return response()->json([
                'success' => false,
                'message' => 'Page not found or unauthorized.'
            ], 404);
        }

        $page->delete();

        return response()->json([
            'success' => true,
            'message' => 'Page deleted successfully.'
        ]);
    }
}
