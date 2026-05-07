<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReactionController extends Controller
{
    public function toggle(Request $request, Post $post): JsonResponse
    {
        $user    = $request->user();
        $existed = $post->reactions()->where('user_id', $user->id)->exists();

        if ($existed) {
            $post->reactions()->where('user_id', $user->id)->delete();
        } else {
            $post->reactions()->create(['user_id' => $user->id]);
            ActivityLog::create([
                'user_id'      => $user->id,
                'action'       => 'reaction.added',
                'subject_type' => 'post',
                'subject_id'   => $post->id,
                'description'  => "Liked \"{$post->title}\"",
            ]);
        }

        return response()->json([
            'reacted'         => !$existed,
            'reactions_count' => $post->reactions()->count(),
        ]);
    }
}
