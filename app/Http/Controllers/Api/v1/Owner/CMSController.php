<?php

namespace App\Http\Controllers\Api\v1\Owner;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Post;
use Illuminate\Http\Request;

class CMSController extends Controller
{
    // ==========================================
    //   PAGES
    // ==========================================

    public function listPages(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $user = $request->user();
        $query = Page::query();

        if ($user && $user->role_id != 1) {
            $query->where('created_by', $user->id);
        } else {
            $createdBy = $request->query('created_by');
            if ($createdBy !== null) {
                $query->where('created_by', $createdBy);
            }
        }

        $pages = $query->skip($skip)->take($limit)->get();
        return response()->json($pages);
    }

    public function listPublishedPages(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $pages = Page::where('status', 'published')->skip($skip)->take($limit)->get();
        return response()->json($pages);
    }

    public function getPage($identifier)
    {
        $page = null;
        if (is_numeric($identifier)) {
            $page = Page::find((int)$identifier);
        }
        if (! $page) {
            $page = Page::where('slug', $identifier)->first();
        }
        if (! $page) {
            return response()->json(['detail' => "Page '{$identifier}' not found."], 404);
        }
        return response()->json($page);
    }

    public function createPage(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or admin can perform this operation.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:pages,slug',
            'content' => 'nullable|string',
            'status' => 'required|string|max:20',
            'created_by' => 'nullable|integer|exists:users,id',
        ]);

        $page = Page::create([
            'title' => $request->title,
            'slug' => $request->slug,
            'content' => $request->content,
            'status' => $request->status,
            'created_by' => $request->created_by ?? $request->user()->id,
        ]);
        return response()->json($page, 201);
    }

    public function updatePage(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or admin can perform this operation.'], 403);
        }

        $page = Page::findOrFail($id);

        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:255|unique:pages,slug,' . $page->id,
            'content' => 'nullable|string',
            'status' => 'sometimes|required|string|max:20',
        ]);

        $page->update($request->only(['title', 'slug', 'content', 'status']));
        return response()->json($page);
    }

    public function deletePage(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or admin can perform this operation.'], 403);
        }

        $page = Page::findOrFail($id);
        $page->delete();

        return response()->json(['detail' => "Page '{$page->title}' deleted successfully."]);
    }

    // ==========================================
    //   POSTS
    // ==========================================

    public function listPosts(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $user = $request->user();
        $query = Post::query();

        if ($user && $user->role_id != 1) {
            $query->where('user_id', $user->id);
        } else {
            $createdBy = $request->query('created_by');
            if ($createdBy !== null) {
                $query->where('user_id', $createdBy);
            }
        }

        $posts = $query->orderBy('created_at', 'desc')->skip($skip)->take($limit)->get();
        return response()->json($posts);
    }

    public function listPublishedPosts(Request $request)
    {
        $skip = $request->query('skip', 0);
        $limit = $request->query('limit', 100);

        $posts = Post::where('status', 'published')->orderBy('created_at', 'desc')->skip($skip)->take($limit)->get();
        return response()->json($posts);
    }

    public function getPost($identifier)
    {
        $post = null;
        if (is_numeric($identifier)) {
            $post = Post::find((int)$identifier);
        }
        if (! $post) {
            $post = Post::where('slug', $identifier)->first();
        }
        if (! $post) {
            return response()->json(['detail' => "Post '{$identifier}' not found."], 404);
        }
        return response()->json($post);
    }

    public function createPost(Request $request)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or admin can perform this operation.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:posts,slug',
            'body' => 'nullable|string',
            'featured_image' => 'nullable|string',
            'status' => 'required|string|max:20',
            'created_by' => 'nullable|integer|exists:users,id',
        ]);

        $post = Post::create([
            'user_id' => $request->created_by ?? $request->user()->id,
            'title' => $request->title,
            'slug' => $request->slug,
            'body' => $request->body,
            'featured_image' => $request->featured_image,
            'status' => $request->status,
        ]);

        return response()->json($post, 201);
    }

    public function updatePost(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or admin can perform this operation.'], 403);
        }

        $post = Post::findOrFail($id);

        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:255|unique:posts,slug,' . $post->id,
            'body' => 'nullable|string',
            'featured_image' => 'nullable|string',
            'status' => 'sometimes|required|string|max:20',
        ]);

        $post->update($request->only(['title', 'slug', 'body', 'featured_image', 'status']));
        return response()->json($post);
    }

    public function deletePost(Request $request, $id)
    {
        if (! in_array($request->user()->role_id, [1, 30003])) {
            return response()->json(['detail' => 'Only store owners or admin can perform this operation.'], 403);
        }

        $post = Post::findOrFail($id);
        $post->delete();

        return response()->json(['detail' => "Post '{$post->title}' deleted successfully."]);
    }
}
