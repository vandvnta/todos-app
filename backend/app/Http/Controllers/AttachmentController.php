<?php

namespace App\Http\Controllers;

use App\Http\Requests\Attachment\StoreAttachmentRequest;
use App\Models\Attachment;
use App\Models\Todo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function store(StoreAttachmentRequest $request, Todo $todo): JsonResponse
    {
        if ($todo->user_id !== $request->user()->id) {
            abort(403, 'Forbidden.');
        }

        $file = $request->file('file');
        $path = $file->store("attachments/{$todo->id}", 'public');

        $attachment = $todo->attachments()->create([
            'user_id'       => $request->user()->id,
            'original_name' => $file->getClientOriginalName(),
            'path'          => $path,
            'mime_type'     => $file->getMimeType(),
            'size'          => $file->getSize(),
        ]);

        return response()->json(['data' => $attachment], 201);
    }

    public function destroy(Request $request, Attachment $attachment): JsonResponse
    {
        if ($attachment->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            abort(403, 'Forbidden.');
        }

        Storage::disk('public')->delete($attachment->path);
        $attachment->delete();

        return response()->json(['message' => 'Attachment deleted successfully.']);
    }
}
