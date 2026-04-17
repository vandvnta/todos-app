import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../api/adminAxios';
import AdminLayout from '../../layouts/AdminLayout';
import type { Category } from '../../types';

export default function CategoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [name, setName]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    adminApi.get<Category>(`/admin/categories/${id}`)
      .then(({ data }) => setName(data.name))
      .catch(() => navigate('/admin/categories'))
      .finally(() => setFetching(false));
  }, [id, isEdit, navigate]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEdit) {
        await adminApi.put(`/admin/categories/${id}`, { name });
      } else {
        await adminApi.post('/admin/categories', { name });
      }
      navigate('/admin/categories');
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response;
      const msg = response?.data?.errors?.name?.[0] ?? response?.data?.message ?? 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <AdminLayout title={isEdit ? 'Edit Category' : 'New Category'}>
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEdit ? 'Edit Category' : 'New Category'}>
      <div className="max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate('/admin/categories')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Categories
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                placeholder="e.g. News, Events..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/categories')}
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
