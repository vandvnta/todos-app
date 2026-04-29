<?php

namespace App\Http\Controllers;

use App\Http\Requests\Todo\StoreTodoRequest;
use App\Http\Requests\Todo\UpdateTodoRequest;
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
            ->with('tags')
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
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

        return response()->json(['data' => $todo->load('tags')], 201);
    }

    public function show(Request $request, Todo $todo): JsonResponse
    {
        $this->authorizeOwnership($request, $todo);

        return response()->json(['data' => $todo->load('tags')]);
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

        return response()->json(['data' => $todo->fresh()->load('tags')]);
    }

    public function destroy(Request $request, Todo $todo): JsonResponse
    {
        $this->authorizeOwnership($request, $todo);

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
