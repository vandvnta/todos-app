<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;

class TagController extends Controller
{
    public function index(): JsonResponse
    {
        $tags = Tag::with('user:id,name')
            ->withCount('todos')
            ->orderBy('name')
            ->paginate(20);

        return response()->json($tags);
    }

    public function destroy(Tag $tag): JsonResponse
    {
        $tag->delete();

        return response()->json(['message' => 'Tag deleted successfully.']);
    }
}
