import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminAxios';
import AdminLayout from '../../layouts/AdminLayout';
import type { PaginatedResponse, Post } from '../../types';

export default function PostsPage() {
  const navigate = useNavigate();

  const [posts, setPosts]             = useState<Post[]>([]);
  const [loading, setLoading]         = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage]       = useState(1);
  const [total, setTotal]             = useState(0);
  const [deletingId, setDeletingId]   = useState<number | null>(null);

  const fetchPosts = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const { data } = await adminApi.get<PaginatedResponse<Post>>('/admin/posts', { params: { page } });
      setPosts(data.data);
      setCurrentPage(data.current_page);
      setLastPage(data.last_page);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(1); }, [fetchPosts]);

  async function handleDelete(post: Post) {
    if (!confirm(`Delete post "${post.title}"?`)) return;
    setDeletingId(post.id);
    try {
      await adminApi.delete(`/admin/posts/${post.id}`);
      await fetchPosts(currentPage);
    } catch {
      alert('Failed to delete post.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout title="Posts">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{total} posts</p>
        <button
          onClick={() => navigate('/admin/posts/create')}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Post
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No posts yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-12">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Image</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{p.id}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800 line-clamp-1">{p.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    {p.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.categories.map((cat) => (
                          <span key={cat.id} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="h-9 w-14 rounded object-cover border border-gray-200" />
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/posts/${p.id}/edit`)}
                        className="rounded-md px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={deletingId === p.id}
                        className="rounded-md px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {deletingId === p.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {lastPage > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => fetchPosts(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {currentPage} of {lastPage}</span>
          <button
            onClick={() => fetchPosts(currentPage + 1)}
            disabled={currentPage === lastPage}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
