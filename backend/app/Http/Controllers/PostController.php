<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $posts = Post::with('categories')
            ->when(
                $request->category_id,
                fn ($q) => $q->whereHas('categories', fn ($q) => $q->where('categories.id', $request->category_id))
            )
            ->latest()
            ->paginate(9);

        return response()->json($posts);
    }

    public function show(Post $post): JsonResponse
    {
        return response()->json($post->load('categories'));
    }
}
