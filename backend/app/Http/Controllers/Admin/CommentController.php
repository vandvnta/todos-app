<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Http\JsonResponse;

class CommentController extends Controller
{
    public function index(): JsonResponse
    {
        $comments = Comment::with(['user:id,name', 'post:id,title'])
            ->latest()
            ->paginate(20);

        return response()->json($comments);
    }

    public function destroy(Comment $comment): JsonResponse
    {
        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully.']);
    }
}
