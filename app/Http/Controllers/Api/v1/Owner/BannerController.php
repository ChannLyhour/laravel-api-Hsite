<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;
use App\Helpers\UploadHelper;

class BannerController extends Controller
{
    /**
     * Public list of active banners.
     */
    public function index(Request $request)
    {
        $createdBy = $request->query('created_by') ?? $request->query('owner_id');

        $version = \Illuminate\Support\Facades\Cache::remember("banners_version_owner_{$createdBy}", 3600, function() {
            return time();
        });
        $cacheKey = "banners_owner_{$createdBy}_v{$version}";

        $banners = \Illuminate\Support\Facades\Cache::remember($cacheKey, 600, function () use ($createdBy) {
            $query = Banner::where('is_active', true);

            if ($createdBy !== null) {
                $query->where('created_by', $createdBy);
            }

            return $query->orderBy('id', 'desc')->get();
        });

        return response()->json($banners);
    }

    /**
     * List of all banners of the logged-in owner.
     */
    public function mine(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $query = Banner::query();

        if ($user->role_id != 1) {
            $query->where('created_by', $user->id);
        } else {
            $createdBy = $request->query('created_by') ?? $request->query('owner_id');
            if ($createdBy !== null) {
                $query->where('created_by', $createdBy);
            }
        }

        return response()->json($query->orderBy('id', 'desc')->get());
    }

    /**
     * Get a specific banner.
     */
    public function show($id)
    {
        $banner = Banner::findOrFail($id);
        return response()->json($banner);
    }

    /**
     * Creates a new banner.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image' => 'required', // Can be file upload or base64/URL string
            'is_active' => 'boolean',
            'created_by' => 'nullable|integer|exists:users,id',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = UploadHelper::uploadImage($request->file('image'), 'banners');
        } elseif (is_string($request->image)) {
            $imagePath = $request->image;
        }

        // Clean domain URL prefix if present
        if ($imagePath && (str_starts_with($imagePath, 'http://') || str_starts_with($imagePath, 'https://'))) {
            $baseUrl = url('/');
            if (str_starts_with($imagePath, $baseUrl)) {
                $imagePath = ltrim(substr($imagePath, strlen($baseUrl)), '/');
            }
        }

        $banner = Banner::create([
            'title' => $request->title,
            'description' => $request->description,
            'image' => $imagePath ?? 'default.png',
            'is_active' => $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : true,
            'created_by' => $request->created_by ?? $user->id,
        ]);

        \Illuminate\Support\Facades\Cache::forget("banners_version_owner_" . $banner->created_by);
        return response()->json($banner, 201);
    }

    /**
     * Updates an existing banner.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $banner = Banner::findOrFail($id);

        // Verify ownership (unless admin)
        if ($user->role_id != 1 && $banner->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this banner.'], 403);
        }

        $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable',
            'is_active' => 'nullable',
        ]);

        $imagePath = $banner->getRawOriginal('image');
        if ($request->hasFile('image')) {
            $imagePath = UploadHelper::updateImage($banner->image, $request->file('image'), 'banners');
        } elseif ($request->has('image') && is_string($request->image)) {
            $imagePath = $request->image;
        }

        // Clean domain URL prefix if present
        if ($imagePath && (str_starts_with($imagePath, 'http://') || str_starts_with($imagePath, 'https://'))) {
            $baseUrl = url('/');
            if (str_starts_with($imagePath, $baseUrl)) {
                $imagePath = ltrim(substr($imagePath, strlen($baseUrl)), '/');
            }
        }

        $updateData = [];
        if ($request->has('title')) {
            $updateData['title'] = $request->title;
        }
        if ($request->has('description')) {
            $updateData['description'] = $request->description;
        }
        if ($imagePath !== null) {
            $updateData['image'] = $imagePath;
        }
        if ($request->has('is_active')) {
            $updateData['is_active'] = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
        }

        $banner->update($updateData);

        \Illuminate\Support\Facades\Cache::forget("banners_version_owner_" . $banner->created_by);
        return response()->json($banner);
    }

    /**
     * Quick status toggle.
     */
    public function toggle(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $banner = Banner::findOrFail($id);

        if ($user->role_id != 1 && $banner->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this banner.'], 403);
        }

        $banner->update([
            'is_active' => ! $banner->is_active
        ]);

        \Illuminate\Support\Facades\Cache::forget("banners_version_owner_" . $banner->created_by);
        return response()->json($banner);
    }

    /**
     * Deletes a banner.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (! in_array($user->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or administrators are allowed.'], 403);
        }

        $banner = Banner::findOrFail($id);

        if ($user->role_id != 1 && $banner->created_by != $user->id) {
            return response()->json(['detail' => 'You do not own this banner.'], 403);
        }

        $imagePath = $banner->getRawOriginal('image');
        if ($imagePath) {
            UploadHelper::deleteImage($imagePath);
        }

        $banner->delete();

        \Illuminate\Support\Facades\Cache::forget("banners_version_owner_" . $banner->created_by);
        return response()->json(['detail' => 'Banner deleted successfully.']);
    }
}
