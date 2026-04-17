<?php

use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\PostController as AdminPostController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\TodoController;
use Illuminate\Support\Facades\Route;

// ─── Public routes ──────────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/refresh',  [AuthController::class, 'refresh']);

Route::get('/posts',        [PostController::class, 'index']);
Route::get('/posts/{post}', [PostController::class, 'show']);
Route::get('/categories',   [CategoryController::class, 'index']);

// ─── Protected routes (JWT) ──────────────────────────────────────────────────
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    Route::apiResource('todos', TodoController::class);

    // ─── Admin routes ────────────────────────────────────────────────────────
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::apiResource('users',      AdminUserController::class);
        Route::apiResource('categories', AdminCategoryController::class);
        Route::apiResource('posts',      AdminPostController::class);
    });
});
