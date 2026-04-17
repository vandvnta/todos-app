import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminAxios';
import AdminLayout from '../../layouts/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
import type { PaginatedResponse, User } from '../../types';

export default function UsersPage() {
  const { admin: currentUser } = useAdminAuth();
  const navigate = useNavigate();

  const [users, setUsers]         = useState<User[]>([]);
  const [loading, setLoading]     = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage]   = useState(1);
  const [total, setTotal]         = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchUsers = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const { data } = await adminApi.get<PaginatedResponse<User>>('/admin/users', {
        params: { page },
      });
      setUsers(data.data);
      setCurrentPage(data.current_page);
      setLastPage(data.last_page);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  async function handleDelete(user: User) {
    if (!confirm(`Delete user "${user.name}"? This action cannot be undone.`)) return;

    setDeletingId(user.id);
    try {
      await adminApi.delete(`/admin/users/${user.id}`);
      await fetchUsers(currentPage);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to delete user.';
      alert(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout title="Users">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Users</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} total users</p>
        </div>
        <button
          onClick={() => navigate('/admin/users/create')}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New User
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{u.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/users/${u.id}/edit`)}
                        className="rounded-md px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={u.id === currentUser?.id || deletingId === u.id}
                        className="rounded-md px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={u.id === currentUser?.id ? 'Cannot delete your own account' : ''}
                      >
                        {deletingId === u.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => fetchUsers(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {lastPage}
          </span>
          <button
            onClick={() => fetchUsers(currentPage + 1)}
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
