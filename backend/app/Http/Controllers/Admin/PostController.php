<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePostRequest;
use App\Http\Requests\Admin\UpdatePostRequest;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    private const IMAGE_DISK = 'public';
    private const IMAGE_FOLDER = 'posts';

    private const ALLOWED_TAGS = [
        'p', 'br', 'strong', 'em', 'u', 's',
        'ul', 'ol', 'li', 'h2', 'h3', 'h4',
        'blockquote', 'pre', 'code',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ];

    private const ALLOWED_ATTRIBUTES = [
        'a'   => ['href', 'title', 'target', 'rel'],
        'img' => ['src', 'alt', 'width', 'height'],
        'td'  => ['colspan', 'rowspan'],
        'th'  => ['colspan', 'rowspan', 'scope'],
    ];

    public function index(): JsonResponse
    {
        $posts = Post::with('categories')->latest()->paginate(10);

        return response()->json($posts);
    }

    public function show(Post $post): JsonResponse
    {
        return response()->json(['data' => $post->load('categories')]);
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $data = $request->validated();

        $data['content'] = $this->sanitizeContent($data['content']);

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store(self::IMAGE_FOLDER, self::IMAGE_DISK);
        }

        $categoryIds = $data['category_ids'] ?? [];
        unset($data['image'], $data['category_ids']);

        $post = Post::create($data);
        $post->categories()->sync($categoryIds);

        return response()->json(['data' => $post->load('categories')], 201);
    }

    public function update(UpdatePostRequest $request, Post $post): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['content'])) {
            $data['content'] = $this->sanitizeContent($data['content']);
        }

        if ($request->hasFile('image')) {
            $this->deleteImage($post);
            $data['image_path'] = $request->file('image')->store(self::IMAGE_FOLDER, self::IMAGE_DISK);
        } elseif ($request->boolean('remove_image')) {
            $this->deleteImage($post);
            $data['image_path'] = null;
        }

        $categoryIds = $data['category_ids'] ?? null;
        unset($data['image'], $data['remove_image'], $data['category_ids']);

        $post->update($data);

        if ($categoryIds !== null) {
            $post->categories()->sync($categoryIds);
        }

        return response()->json(['data' => $post->fresh()->load('categories')]);
    }

    public function destroy(Post $post): JsonResponse
    {
        $this->deleteImage($post);

        $post->delete();

        return response()->json(['message' => 'Post deleted successfully.']);
    }

    private function sanitizeContent(string $content): string
    {
        $allowedTagString = implode('', array_map(fn($t) => "<$t>", self::ALLOWED_TAGS));
        $content = strip_tags($content, $allowedTagString);

        $dom = new \DOMDocument('1.0', 'UTF-8');
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8">' . $content);
        libxml_clear_errors();

        foreach ($dom->getElementsByTagName('*') as $node) {
            $tag     = strtolower($node->nodeName);
            $allowed = self::ALLOWED_ATTRIBUTES[$tag] ?? [];

            $toRemove = [];
            foreach ($node->attributes as $attr) {
                if (!in_array(strtolower($attr->name), $allowed, true)) {
                    $toRemove[] = $attr->name;
                }
            }
            foreach ($toRemove as $attrName) {
                $node->removeAttribute($attrName);
            }

            foreach (['href', 'src'] as $urlAttr) {
                $val = $node->getAttribute($urlAttr);
                if ($val && preg_match('/^\s*(javascript|data):/i', $val)) {
                    $node->setAttribute($urlAttr, '#');
                }
            }
        }

        $body   = $dom->getElementsByTagName('body')->item(0);
        $result = '';
        if ($body) {
            foreach ($body->childNodes as $child) {
                $result .= $dom->saveHTML($child);
            }
        }

        return $result;
    }

    private function deleteImage(Post $post)
    {
        if ($post->image_path) {
            Storage::disk(self::IMAGE_DISK)->delete($post->image_path);
        }
    }
}
