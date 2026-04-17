import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminAxios';
import AdminLayout from '../../layouts/AdminLayout';
import type { Category } from '../../types';

export default function CategoriesPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get<Category[]>('/admin/categories');
      setCategories(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  async function handleDelete(category: Category) {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    setDeletingId(category.id);
    try {
      await adminApi.delete(`/admin/categories/${category.id}`);
      await fetchCategories();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to delete category.';
      alert(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout title="Categories">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{categories.length} categories</p>
        <button
          onClick={() => navigate('/admin/categories/create')}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Category
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No categories yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Posts</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{c.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {c.posts_count ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/categories/${c.id}/edit`)}
                        className="rounded-md px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        disabled={deletingId === c.id}
                        className="rounded-md px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {deletingId === c.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
