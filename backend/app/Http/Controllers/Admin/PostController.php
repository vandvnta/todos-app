<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePostRequest;
use App\Http\Requests\Admin\UpdatePostRequest;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    public function index(): JsonResponse
    {
        $posts = Post::with('categories')->latest()->paginate(10);

        return response()->json($posts);
    }

    public function show(Post $post): JsonResponse
    {
        return response()->json($post->load('categories'));
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('posts', 'public');
        }

        $categoryIds = $data['category_ids'] ?? [];
        unset($data['image'], $data['category_ids']);

        $post = Post::create($data);
        $post->categories()->sync($categoryIds);

        return response()->json($post->load('categories'), 201);
    }

    public function update(UpdatePostRequest $request, Post $post): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            if ($post->image_path) {
                Storage::disk('public')->delete($post->image_path);
            }
            $data['image_path'] = $request->file('image')->store('posts', 'public');
        } elseif ($request->boolean('remove_image')) {
            if ($post->image_path) {
                Storage::disk('public')->delete($post->image_path);
            }
            $data['image_path'] = null;
        }

        $categoryIds = $data['category_ids'] ?? null;
        unset($data['image'], $data['remove_image'], $data['category_ids']);

        $post->update($data);

        if ($categoryIds !== null) {
            $post->categories()->sync($categoryIds);
        }

        return response()->json($post->fresh()->load('categories'));
    }

    public function destroy(Post $post): JsonResponse
    {
        if ($post->image_path) {
            Storage::disk('public')->delete($post->image_path);
        }

        $post->delete();

        return response()->json(['message' => 'Post deleted successfully.']);
    }
}
