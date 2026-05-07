<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\Admin\ActivityLogController as AdminActivityLogController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\CommentController as AdminCommentController;
use App\Http\Controllers\Admin\PostController as AdminPostController;
use App\Http\Controllers\Admin\ProjectController as AdminProjectController;
use App\Http\Controllers\Admin\TagController as AdminTagController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ReactionController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TodoController;
use Illuminate\Support\Facades\Route;

// ─── Public routes ───────────────────────────────────────────────────────────
Route::middleware('throttle:10,1')->post('/register', [AuthController::class, 'register']);
Route::middleware('throttle:5,1')->post('/login',     [AuthController::class, 'login']);
Route::middleware('throttle:10,1')->post('/refresh',  [AuthController::class, 'refresh']);

Route::get('/posts',                 [PostController::class, 'index']);
Route::get('/posts/{post}',          [PostController::class, 'show']);
Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
Route::get('/categories',            [CategoryController::class, 'index']);

// ─── Protected routes (JWT) ──────────────────────────────────────────────────
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Todos
    Route::apiResource('todos', TodoController::class);

    // Tags
    Route::apiResource('tags', TagController::class)->only(['index', 'store', 'destroy']);

    // Projects
    Route::apiResource('projects', ProjectController::class)->except(['show']);

    // Attachments
    Route::post('/todos/{todo}/attachments',      [AttachmentController::class, 'store']);
    Route::delete('/attachments/{attachment}',    [AttachmentController::class, 'destroy']);

    // Comments
    Route::post('/posts/{post}/comments',  [CommentController::class, 'store']);
    Route::delete('/comments/{comment}',   [CommentController::class, 'destroy']);

    // Reactions & Bookmarks
    Route::post('/posts/{post}/reactions', [ReactionController::class, 'toggle']);
    Route::post('/posts/{post}/bookmarks', [BookmarkController::class, 'toggle']);
    Route::get('/bookmarks',               [BookmarkController::class, 'index']);

    // Notifications
    Route::get('/notifications',                           [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count',              [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{notification}/read',       [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all',                  [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{notification}',         [NotificationController::class, 'destroy']);

    // Activity log
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);

    // ─── Admin routes ─────────────────────────────────────────────────────────
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::apiResource('users',      AdminUserController::class);
        Route::apiResource('categories', AdminCategoryController::class);
        Route::apiResource('posts',      AdminPostController::class);

        Route::get('comments',              [AdminCommentController::class, 'index']);
        Route::delete('comments/{comment}', [AdminCommentController::class, 'destroy']);

        Route::get('tags',              [AdminTagController::class, 'index']);
        Route::delete('tags/{tag}',     [AdminTagController::class, 'destroy']);

        Route::get('projects',              [AdminProjectController::class, 'index']);
        Route::delete('projects/{project}', [AdminProjectController::class, 'destroy']);

        Route::get('activity-logs', [AdminActivityLogController::class, 'index']);
    });
});
