<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Policy;
use Illuminate\Http\Request;
use Vinkla\Hashids\Facades\Hashids;

class PolicyController extends Controller
{
    /**
     * Public endpoint: Retrieve a published policy by owner_id and slug.
     */
    public function getPublicPolicy(Request $request)
    {
        $ownerId = $request->query('owner_id');
        $slug = $request->query('slug');

        if (!$ownerId || !$slug) {
            return response()->json([
                'success' => false,
                'message' => 'owner_id and slug query parameters are required.'
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

        $policy = Policy::where('created_by', $realOwnerId)
            ->where('slug', strtolower($slug))
            ->where('status', 'published')
            ->first();

        if (!$policy) {
            return response()->json([
                'success' => false,
                'message' => 'Policy not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $policy
        ]);
    }

    /**
     * Authenticated endpoint: List all policies for the store owner.
     */
    public function index(Request $request)
    {
        $policies = Policy::where('created_by', $request->user()->id)->get();
        return response()->json([
            'success' => true,
            'data' => $policies
        ]);
    }

    /**
     * Authenticated endpoint: Create or update a policy.
     */
    public function store(Request $request)
    {
        $request->validate([
            'slug' => 'required|string|max:100',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'nullable|string|in:draft,published',
        ]);

        $policy = Policy::updateOrCreate(
            [
                'created_by' => $request->user()->id,
                'slug' => strtolower($request->input('slug')),
            ],
            [
                'title' => $request->input('title'),
                'content' => $request->input('content'),
                'status' => $request->input('status', 'draft'),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Policy saved successfully.',
            'data' => $policy
        ]);
    }

    /**
     * Authenticated endpoint: Delete a policy.
     */
    public function destroy(Request $request, $id)
    {
        $policy = Policy::where('created_by', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$policy) {
            return response()->json([
                'success' => false,
                'message' => 'Policy not found or unauthorized.'
            ], 404);
        }

        $policy->delete();

        return response()->json([
            'success' => true,
            'message' => 'Policy deleted successfully.'
        ]);
    }
}
