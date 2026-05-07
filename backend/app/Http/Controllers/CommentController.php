<?php

namespace App\Http\Controllers;

use App\Http\Requests\Comment\StoreCommentRequest;
use App\Models\ActivityLog;
use App\Models\Comment;
use App\Models\Notification;
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
        $user    = $request->user();
        $comment = $post->comments()->create([
            'user_id' => $user->id,
            'content' => $request->validated()['content'],
        ]);

        $comment->load('user:id,name');

        // Notify previous commenters on this post (except current user)
        $recipientIds = Comment::where('post_id', $post->id)
            ->where('user_id', '!=', $user->id)
            ->where('id', '!=', $comment->id)
            ->distinct()
            ->pluck('user_id');

        foreach ($recipientIds as $recipientId) {
            Notification::create([
                'user_id' => $recipientId,
                'type'    => 'new_comment',
                'data'    => [
                    'post_id'        => $post->id,
                    'post_title'     => $post->title,
                    'commenter_name' => $user->name,
                    'comment_id'     => $comment->id,
                ],
            ]);
        }

        ActivityLog::create([
            'user_id'      => $user->id,
            'action'       => 'comment.posted',
            'subject_type' => 'post',
            'subject_id'   => $post->id,
            'description'  => "Commented on \"{$post->title}\"",
        ]);

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
