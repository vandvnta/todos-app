<?php

namespace App\Http\Requests\Todo;

use App\Enums\TodoStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTodoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'        => ['sometimes', 'required', 'string', 'max:255'],
            'description'  => ['nullable', 'string', 'max:5000'],
            'status'       => ['sometimes', Rule::enum(TodoStatus::class)],
            'image'        => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image' => ['nullable', 'boolean'],
            'tag_ids'      => ['nullable', 'array'],
            'tag_ids.*'    => ['integer', Rule::exists('tags', 'id')->where('user_id', $this->user()->id)],
        ];
    }
}
