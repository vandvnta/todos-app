import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  BlockQuote,
  Bold,
  ClassicEditor,
  Essentials,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  Heading,
  HorizontalLine,
  Indent,
  IndentBlock,
  Italic,
  Link,
  List,
  Paragraph,
  Underline,
  Undo,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../api/adminAxios';
import AdminLayout from '../../layouts/AdminLayout';
import { useToast } from '../../context/ToastContext';
import type { Category, Post } from '../../types';

const EDITOR_CONFIG = {
  licenseKey: 'GPL',
  plugins: [
    Bold, Essentials, FontBackgroundColor, FontColor, FontFamily, FontSize,
    Heading, HorizontalLine, Indent, IndentBlock,
    Italic, Link, List, Paragraph, BlockQuote, Underline, Undo,
  ],
  toolbar: [
    'heading', '|',
    'fontFamily', 'fontSize', '|',
    'fontColor', 'fontBackgroundColor', '|',
    'bold', 'italic', 'underline', '|',
    'link', 'bulletedList', 'numberedList', '|',
    'outdent', 'indent', '|',
    'blockQuote', 'horizontalLine', '|',
    'undo', 'redo',
  ],
  fontFamily: {
    options: [
      'default',
      'Arial, Helvetica, sans-serif',
      'Georgia, serif',
      'Tahoma, Geneva, sans-serif',
      'Times New Roman, Times, serif',
      'Trebuchet MS, Helvetica, sans-serif',
      'Verdana, Geneva, sans-serif',
    ],
  },
  fontSize: {
    options: [10, 12, 14, 'default', 18, 20, 24, 28, 32],
  },
};

export default function PostFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle]               = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [content, setContent]           = useState('');
  const [image, setImage]               = useState<File | null>(null);
  const [preview, setPreview]           = useState<string | null>(null);
  const [removeImage, setRemoveImage]   = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [loading, setLoading]       = useState(false);
  const [fetching, setFetching]     = useState(true);

  // Load categories + post (if edit)
  useEffect(() => {
    const load = async () => {
      const { data: catsRes } = await adminApi.get<{ data: Category[] }>('/admin/categories');
      setCategories(catsRes.data);

      if (isEdit) {
        const { data: postRes } = await adminApi.get<{ data: Post }>(`/admin/posts/${id}`);
        setTitle(postRes.data.title);
        setSelectedCategoryIds(postRes.data.categories.map((c) => c.id));
        setContent(postRes.data.content);
        setPreview(postRes.data.image_url);
      }
    };

    load()
      .catch(() => navigate('/admin/posts'))
      .finally(() => setFetching(false));
  }, [id, isEdit, navigate]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImage(file);
    setRemoveImage(false);
    if (file) {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(file));
    }
  }

  function handleRemoveImage() {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setImage(null);
    setPreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      selectedCategoryIds.forEach((cid) => formData.append('category_ids[]', String(cid)));
      if (image) formData.append('image', image);
      if (isEdit && removeImage) formData.append('remove_image', '1');
      if (isEdit) formData.append('_method', 'PUT');

      const url = isEdit ? `/admin/posts/${id}` : '/admin/posts';
      await adminApi.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast(isEdit ? 'Post updated successfully.' : 'Post created successfully.');
      navigate('/admin/posts');
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response;
      if (response?.data?.errors) {
        const flat: Record<string, string> = {};
        for (const [key, messages] of Object.entries(response.data.errors)) {
          flat[key] = messages[0];
        }
        setErrors(flat);
      } else {
        setErrors({ title: response?.data?.message ?? 'Something went wrong.' });
      }
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <AdminLayout title={isEdit ? 'Edit Post' : 'New Post'}>
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEdit ? 'Edit Post' : 'New Post'}>
      <div className="max-w-2xl">
        <div className="mb-6">
          <button onClick={() => navigate('/admin/posts')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Posts
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
            </div>

            {/* Categories */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Categories</label>
              <div className="flex flex-wrap gap-2 rounded-lg border border-gray-300 p-3">
                {categories.length === 0 && (
                  <span className="text-sm text-gray-400">No categories available</span>
                )}
                {categories.map((c) => {
                  const checked = selectedCategoryIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                        checked
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={() =>
                          setSelectedCategoryIds((prev) =>
                            checked ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          )
                        }
                      />
                      {checked && (
                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      )}
                      {c.name}
                    </label>
                  );
                })}
              </div>
              {errors.category_ids && <p className="mt-1 text-xs text-red-600">{errors.category_ids}</p>}
            </div>

            {/* Content */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Content *</label>
              <div className="rounded-lg border border-gray-300 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <CKEditor
                  editor={ClassicEditor}
                  data={content}
                  config={EDITOR_CONFIG}
                  onChange={(_event, editor) => setContent(editor.getData())}
                />
              </div>
              {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content}</p>}
            </div>

            {/* Image */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Image</label>
              {preview ? (
                <div className="relative inline-block w-full">
                  <img src={preview} alt="Preview" className="h-48 w-full rounded-lg object-cover border border-gray-200" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8 hover:border-blue-400 hover:bg-blue-50">
                  <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm text-gray-500">Click to upload (JPG, PNG, WebP — max 2MB)</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpg,image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
              {errors.image && <p className="mt-1 text-xs text-red-600">{errors.image}</p>}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Post'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/posts')}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
