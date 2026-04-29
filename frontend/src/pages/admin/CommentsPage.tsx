import { useCallback, useEffect, useState } from 'react';
import adminApi from '../../api/adminAxios';
import AdminLayout from '../../layouts/AdminLayout';
import ConfirmModal from '../../components/ConfirmModal';
import ToastBanner from '../../components/ToastBanner';
import { useToast } from '../../context/ToastContext';
import type { Comment, PaginatedResponse } from '../../types';

export default function CommentsPage() {
  const { showToast } = useToast();

  const [comments, setComments]   = useState<Comment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage]   = useState(1);
  const [total, setTotal]         = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Comment | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchComments = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const { data } = await adminApi.get<PaginatedResponse<Comment>>('/admin/comments', {
        params: { page },
      });
      setComments(data.data);
      setCurrentPage(data.current_page);
      setLastPage(data.last_page);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    try {
      await adminApi.delete(`/admin/comments/${pendingDelete.id}`);
      showToast('Comment deleted successfully.');
      setPendingDelete(null);
      await fetchComments(currentPage);
    } catch {
      showToast('Failed to delete comment.', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout title="Comments">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Comments</h2>
          <p className="mt-0.5 text-sm text-gray-500">{total} total comments</p>
        </div>
      </div>

      <ToastBanner />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No comments found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Author</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Post</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Content</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comments.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.user.name}</td>
                  <td className="px-4 py-3">
                    {c.post ? (
                      <a
                        href={`/posts/${c.post.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {c.post.title.length > 40 ? c.post.title.slice(0, 40) + '…' : c.post.title}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.content.length > 80 ? c.content.slice(0, 80) + '…' : c.content}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setPendingDelete(c)}
                      disabled={deletingId === c.id}
                      className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deletingId === c.id ? 'Deleting…' : 'Delete'}
                    </button>
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
            onClick={() => fetchComments(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {currentPage} of {lastPage}</span>
          <button
            onClick={() => fetchComments(currentPage + 1)}
            disabled={currentPage === lastPage}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete Comment"
        message={`Delete this comment by "${pendingDelete?.user.name}"? This action cannot be undone.`}
        isLoading={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
