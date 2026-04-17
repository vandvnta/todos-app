<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'          => ['sometimes', 'required', 'string', 'max:255'],
            'category_ids'   => ['nullable', 'array'],
            'category_ids.*' => ['exists:categories,id'],
            'content'        => ['sometimes', 'required', 'string'],
            'image'          => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image'   => ['nullable', 'boolean'],
        ];
    }
}
