<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create pivot table
        Schema::create('category_post', function (Blueprint $table) {
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->primary(['category_id', 'post_id']);
        });

        // 2. Migrate existing category_id data into pivot
        if (Schema::hasColumn('posts', 'category_id')) {
            DB::table('posts')
                ->whereNotNull('category_id')
                ->get(['id', 'category_id'])
                ->each(fn ($row) => DB::table('category_post')->insert([
                    'category_id' => $row->category_id,
                    'post_id'     => $row->id,
                ]));

            // 3. Drop old column
            Schema::table('posts', function (Blueprint $table) {
                $table->dropForeign(['category_id']);
                $table->dropColumn('category_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->nullOnDelete()->constrained();
        });

        // Restore first category for each post
        DB::table('category_post')
            ->orderBy('post_id')
            ->get()
            ->groupBy('post_id')
            ->each(fn ($rows, $postId) => DB::table('posts')
                ->where('id', $postId)
                ->update(['category_id' => $rows->first()->category_id])
            );

        Schema::dropIfExists('category_post');
    }
};
