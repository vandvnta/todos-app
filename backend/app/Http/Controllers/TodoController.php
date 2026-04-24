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
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->latest()
            ->paginate(15);

        return response()->json($todos);
    }

    public function store(StoreTodoRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('todos', 'public');
        }

        $todo = $request->user()->todos()->create($data);

        return response()->json(['data' => $todo], 201);
    }

    public function show(Request $request, Todo $todo): JsonResponse
    {
        $this->authorizeOwnership($request, $todo);

        return response()->json(['data' => $todo]);
    }

    public function update(UpdateTodoRequest $request, Todo $todo): JsonResponse
    {
        $this->authorizeOwnership($request, $todo);

        $data = $request->validated();

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

        return response()->json(['data' => $todo->fresh()]);
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
