import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import type { Project, Tag, Todo, TodoFormData, TodoStatus } from '../types';

interface Props {
  initial?: Todo | null;
  onSubmit: (data: TodoFormData) => Promise<void>;
  onCancel: () => void;
}

const STATUS_OPTIONS: { value: TodoStatus; label: string }[] = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
];

export default function TodoForm({ initial, onSubmit, onCancel }: Props) {
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus]           = useState<TodoStatus>('pending');
  const [image, setImage]             = useState<File | null>(null);
  const [preview, setPreview]         = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const [allTags, setAllTags]         = useState<Tag[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [newTagName, setNewTagName]   = useState('');
  const [tagLoading, setTagLoading]   = useState(false);

  const [projects, setProjects]       = useState<Project[]>([]);
  const [projectId, setProjectId]     = useState<number | null>(null);

  useEffect(() => {
    api.get<{ data: Tag[] }>('/tags').then(({ data }) => setAllTags(data.data));
    api.get<{ data: Project[] }>('/projects').then(({ data }) => setProjects(data.data));
  }, []);

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setDescription(initial.description ?? '');
      setStatus(initial.status);
      setPreview(initial.image_url ?? null);
      setSelectedIds(initial.tags.map((t) => t.id));
      setProjectId(initial.project?.id ?? null);
    }
  }, [initial]);

  function toggleTag(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleAddTag() {
    const name = newTagName.trim();
    if (!name) return;
    setTagLoading(true);
    try {
      const { data } = await api.post<{ data: Tag }>('/tags', { name });
      setAllTags((prev) => [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedIds((prev) => [...prev, data.data.id]);
      setNewTagName('');
    } catch {
      // tag already exists or validation error — ignore silently
    } finally {
      setTagLoading(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImage(file);
    setImageRemoved(false);
    if (file) setPreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImage(null);
    setPreview(null);
    setImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), description, status, image, removeImage: imageRemoved, tagIds: selectedIds, projectId });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TodoStatus)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Project */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Project</label>
        <select
          value={projectId ?? ''}
          onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Tags</label>

        {allTags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const selected = selectedIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-full border px-3 py-0.5 text-xs font-medium transition ${
                    selected
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-emerald-400 hover:text-emerald-600'
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
            placeholder="New tag name…"
            maxLength={50}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={tagLoading || !newTagName.trim()}
            className="rounded-lg border border-emerald-500 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>

      {/* Image upload */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Image</label>

        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="h-40 w-full rounded-lg object-cover border border-gray-200"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              title="Remove image"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-6 hover:border-blue-400 hover:bg-blue-50">
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
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
