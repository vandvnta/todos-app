<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tag\StoreTagRequest;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TagController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tags = $request->user()->tags()->orderBy('name')->get();

        return response()->json(['data' => $tags]);
    }

    public function store(StoreTagRequest $request): JsonResponse
    {
        $name = $request->validated()['name'];
        $slug = Str::slug($name);

        $base  = $slug;
        $count = 1;
        while ($request->user()->tags()->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $count++;
        }

        $tag = $request->user()->tags()->create(['name' => $name, 'slug' => $slug]);

        return response()->json(['data' => $tag], 201);
    }

    public function destroy(Request $request, Tag $tag): JsonResponse
    {
        if ($tag->user_id !== $request->user()->id) {
            abort(403, 'Forbidden.');
        }

        $tag->delete();

        return response()->json(['message' => 'Tag deleted successfully.']);
    }
}
