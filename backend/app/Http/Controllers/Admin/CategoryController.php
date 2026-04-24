<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::withCount('posts')->latest()->get();

        return response()->json(['data' => $categories]);
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json(['data' => $category->loadCount('posts')]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
        ]);

        return response()->json(['data' => $category], 201);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $data = [];

        if ($request->filled('name')) {
            $data['name'] = $request->name;
            $data['slug'] = Str::slug($request->name);
        }

        if (!empty($data)) {
            $category->update($data);
        }

        return response()->json(['data' => $category->fresh()]);
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->posts()->exists()) {
            return response()->json(['message' => 'Cannot delete category with existing posts.'], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully.']);
    }
}
