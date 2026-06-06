<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Like;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    /**
     * Toggle like/unlike for a product.
     */
    public function toggleProductLike(Request $request, $id)
    {
        $user = $request->user();
        $product = Product::findOrFail($id);

        $like = Like::where('user_id', $user->id)
            ->where('likeable_id', $product->id)
            ->where('likeable_type', Product::class)
            ->first();

        if ($like) {
            $like->delete();
            return response()->json([
                'status' => 'unliked',
                'is_liked' => false,
                'message' => 'Product unliked successfully.'
            ]);
        } else {
            Like::create([
                'user_id' => $user->id,
                'likeable_id' => $product->id,
                'likeable_type' => Product::class,
                'created_by' => $user->id,
            ]);
            return response()->json([
                'status' => 'liked',
                'is_liked' => true,
                'message' => 'Product liked successfully.'
            ]);
        }
    }

    /**
     * Get the like status and count for a product for the current user.
     */
    public function getProductLikeStatus(Request $request, $id)
    {
        $user = $request->user();
        $product = Product::findOrFail($id);

        $isLiked = Like::where('user_id', $user->id)
            ->where('likeable_id', $product->id)
            ->where('likeable_type', Product::class)
            ->exists();

        $likeCount = Like::where('likeable_id', $product->id)
            ->where('likeable_type', Product::class)
            ->count();

        return response()->json([
            'is_liked' => $isLiked,
            'like_count' => $likeCount
        ]);
    }

    /**
     * Get all product IDs liked by the current user.
     */
    public function getMyLikedProductIds(Request $request)
    {
        $user = $request->user();
        
        // This looks into the 'likes' table and gets product IDs for this user
        $likedIds = Like::where('user_id', $user->id)
            ->where('likeable_type', Product::class)
            ->pluck('likeable_id');

        return response()->json($likedIds);
    }
}
