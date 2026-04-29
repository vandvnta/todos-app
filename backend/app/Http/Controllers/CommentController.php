<?php

namespace App\Http\Controllers;

use App\Http\Requests\Comment\StoreCommentRequest;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Post $post): JsonResponse
    {
        $comments = $post->comments()
            ->with('user:id,name')
            ->oldest()
            ->get();

        return response()->json(['data' => $comments]);
    }

    public function store(StoreCommentRequest $request, Post $post): JsonResponse
    {
        $comment = $post->comments()->create([
            'user_id' => $request->user()->id,
            'content' => $request->validated()['content'],
        ]);

        $comment->load('user:id,name');

        return response()->json(['data' => $comment], 201);
    }

    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        if ($comment->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            abort(403, 'Forbidden.');
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully.']);
    }
}
