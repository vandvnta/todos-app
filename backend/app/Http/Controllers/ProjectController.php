<?php

namespace App\Http\Controllers;

use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $projects = $request->user()
            ->projects()
            ->withCount('todos')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $projects]);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = $request->user()->projects()->create($request->validated());

        return response()->json(['data' => $project], 201);
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $this->authorizeOwnership($request, $project);
        $project->update($request->validated());

        return response()->json(['data' => $project->fresh()]);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->authorizeOwnership($request, $project);
        $project->delete();

        return response()->json(['message' => 'Project deleted successfully.']);
    }

    private function authorizeOwnership(Request $request, Project $project): void
    {
        if ($project->user_id !== $request->user()->id) {
            abort(403, 'Forbidden.');
        }
    }
}
