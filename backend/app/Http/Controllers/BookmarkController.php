<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Bookmark;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $posts = Post::whereHas('bookmarks', fn($q) => $q->where('user_id', $request->user()->id))
            ->with('categories')
            ->withCount('reactions')
            ->latest()
            ->paginate(9);

        return response()->json($posts);
    }

    public function toggle(Request $request, Post $post): JsonResponse
    {
        $user    = $request->user();
        $existed = $post->bookmarks()->where('user_id', $user->id)->exists();

        if ($existed) {
            $post->bookmarks()->where('user_id', $user->id)->delete();
        } else {
            $post->bookmarks()->create(['user_id' => $user->id]);
            ActivityLog::create([
                'user_id'      => $user->id,
                'action'       => 'bookmark.added',
                'subject_type' => 'post',
                'subject_id'   => $post->id,
                'description'  => "Bookmarked \"{$post->title}\"",
            ]);
        }

        return response()->json(['bookmarked' => !$existed]);
    }
}
