<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $this->tryGetUserId($request);

        $posts = Post::with('categories')
            ->withCount('reactions')
            ->when(
                $request->category_id,
                fn ($q) => $q->whereHas('categories', fn ($q) => $q->where('categories.id', $request->category_id))
            )
            ->latest()
            ->paginate(9);

        if ($userId) {
            $postIds = $posts->pluck('id');
            $reacted    = \App\Models\Reaction::whereIn('post_id', $postIds)->where('user_id', $userId)->pluck('post_id')->flip();
            $bookmarked = \App\Models\Bookmark::whereIn('post_id', $postIds)->where('user_id', $userId)->pluck('post_id')->flip();

            $posts->getCollection()->transform(function ($post) use ($reacted, $bookmarked) {
                $post->setAttribute('is_reacted',    $reacted->has($post->id));
                $post->setAttribute('is_bookmarked', $bookmarked->has($post->id));
                return $post;
            });
        }

        return response()->json($posts);
    }

    public function show(Request $request, Post $post): JsonResponse
    {
        $userId = $this->tryGetUserId($request);

        $post->load('categories')->loadCount('reactions');

        if ($userId) {
            $post->setAttribute('is_reacted',    $post->reactions()->where('user_id', $userId)->exists());
            $post->setAttribute('is_bookmarked', $post->bookmarks()->where('user_id', $userId)->exists());
        }

        return response()->json($post);
    }

    private function tryGetUserId(Request $request): ?int
    {
        try {
            $token = $request->bearerToken();
            if (!$token) return null;
            $user = JWTAuth::setToken($token)->authenticate();
            return $user?->id;
        } catch (\Exception) {
            return null;
        }
    }
}
