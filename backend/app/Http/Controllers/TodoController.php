<?php

namespace App\Http\Controllers;

use App\Http\Requests\Todo\StoreTodoRequest;
use App\Http\Requests\Todo\UpdateTodoRequest;
use App\Models\ActivityLog;
use App\Models\Todo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TodoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $todos = $request->user()
            ->todos()
            ->with(['tags', 'project:id,name,color'])
            ->when($request->query('status'),     fn ($q, $v) => $q->where('status', $v))
            ->when($request->query('project_id'), fn ($q, $v) => $q->where('project_id', $v))
            ->latest()
            ->paginate(15);

        return response()->json($todos);
    }

    public function store(StoreTodoRequest $request): JsonResponse
    {
        $data   = $request->validated();
        $tagIds = $data['tag_ids'] ?? [];
        unset($data['tag_ids']);

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('todos', 'public');
        }

        $todo = $request->user()->todos()->create($data);
        $todo->tags()->sync($tagIds);

        ActivityLog::create([
            'user_id'      => $request->user()->id,
            'action'       => 'todo.created',
            'subject_type' => 'todo',
            'subject_id'   => $todo->id,
            'description'  => "Created todo \"{$todo->title}\"",
        ]);

        return response()->json(['data' => $todo->load(['tags', 'project:id,name,color'])], 201);
    }

    public function show(Request $request, Todo $todo): JsonResponse
    {
        $this->authorizeOwnership($request, $todo);

        return response()->json(['data' => $todo->load(['tags', 'project:id,name,color', 'attachments'])]);
    }

    public function update(UpdateTodoRequest $request, Todo $todo): JsonResponse
    {
        $this->authorizeOwnership($request, $todo);

        $data   = $request->validated();
        $tagIds = array_key_exists('tag_ids', $data) ? ($data['tag_ids'] ?? []) : null;
        unset($data['tag_ids']);

        if ($request->hasFile('image')) {
            if ($todo->image_path) {
                Storage::disk('public')->delete($todo->image_path);
            }
            $data['image_path'] = $request->file('image')->store('todos', 'public');
        } elseif ($request->boolean('remove_image')) {
            if ($todo->image_path) {
                Storage::disk('public')->delete($todo->image_path);
            }
            $data['image_path'] = null;
        }

        $todo->update($data);

        if ($tagIds !== null) {
            $todo->tags()->sync($tagIds);
        }

        ActivityLog::create([
            'user_id'      => $request->user()->id,
            'action'       => 'todo.updated',
            'subject_type' => 'todo',
            'subject_id'   => $todo->id,
            'description'  => "Updated todo \"{$todo->title}\"",
        ]);

        return response()->json(['data' => $todo->fresh()->load(['tags', 'project:id,name,color'])]);
    }

    public function destroy(Request $request, Todo $todo): JsonResponse
    {
        $this->authorizeOwnership($request, $todo);

        ActivityLog::create([
            'user_id'      => $request->user()->id,
            'action'       => 'todo.deleted',
            'subject_type' => 'todo',
            'subject_id'   => $todo->id,
            'description'  => "Deleted todo \"{$todo->title}\"",
        ]);

        if ($todo->image_path) {
            Storage::disk('public')->delete($todo->image_path);
        }

        $todo->delete();

        return response()->json(['message' => 'Todo deleted successfully.']);
    }

    private function authorizeOwnership(Request $request, Todo $todo): void
    {
        if ($todo->user_id !== $request->user()->id) {
            abort(403, 'Forbidden.');
        }
    }
}
