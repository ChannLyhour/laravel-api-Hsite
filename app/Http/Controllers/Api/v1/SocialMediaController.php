<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\SocialMedia;
use Illuminate\Http\Request;

class SocialMediaController extends Controller
{
    /**
     * Public list of active social media links filtered by owner ID.
     */
    public function index(Request $request)
    {
        $createdBy = $request->query('created_by');
        $query = SocialMedia::where('status', true);

        if ($createdBy !== null) {
            $query->where('created_by', $createdBy);
        }

        return response()->json($query->get());
    }

    /**
     * List of all social media links of the logged-in owner.
     */
    public function mine(Request $request)
    {
        $user = $request->user();
        $query = SocialMedia::query();

        if ($user->role_id != 1) {
            $query->where('created_by', $user->id);
        } else {
            $createdBy = $request->query('created_by');
            if ($createdBy !== null) {
                $query->where('created_by', $createdBy);
            }
        }

        return response()->json($query->get());
    }

    /**
     * Creates a new social link.
     */
    public function store(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:50',
            'link' => 'required|string|url',
            'status' => 'boolean',
            'created_by' => 'nullable|integer|exists:users,id',
        ]);

        $social = SocialMedia::create([
            'name' => strtolower($request->name),
            'link' => $request->link,
            'status' => $request->status ?? true,
            'created_by' => $request->created_by ?? $request->user()->id,
        ]);

        return response()->json($social, 201);
    }

    /**
     * Updates name/link details.
     */
    public function update(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $social = SocialMedia::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:50',
            'link' => 'sometimes|required|string|url',
            'status' => 'boolean',
        ]);

        $social->update([
            'name' => $request->name ? strtolower($request->name) : $social->name,
            'link' => $request->link ?? $social->link,
            'status' => $request->has('status') ? $request->status : $social->status,
        ]);

        return response()->json($social);
    }

    /**
     * Toggles active status.
     */
    public function toggle(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $social = SocialMedia::findOrFail($id);
        $social->update([
            'status' => !$social->status
        ]);
        return response()->json($social);
    }

    /**
     * Deletes the link.
     */
    public function destroy(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 2, 30003])) {
            return response()->json(['detail' => 'Only administrators are allowed.'], 403);
        }

        $social = SocialMedia::findOrFail($id);
        $social->delete();

        return response()->json(['detail' => 'Social media link deleted successfully.']);
    }
}
