import { useCallback, useEffect, useState } from 'react';
import adminApi from '../../api/adminAxios';
import AdminLayout from '../../layouts/AdminLayout';
import ConfirmModal from '../../components/ConfirmModal';
import ToastBanner from '../../components/ToastBanner';
import { useToast } from '../../context/ToastContext';
import type { PaginatedResponse, Project } from '../../types';

export default function AdminProjectsPage() {
  const { showToast } = useToast();

  const [projects, setProjects]           = useState<Project[]>([]);
  const [loading, setLoading]             = useState(true);
  const [currentPage, setCurrentPage]     = useState(1);
  const [lastPage, setLastPage]           = useState(1);
  const [total, setTotal]                 = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [deletingId, setDeletingId]       = useState<number | null>(null);

  const fetchProjects = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const { data } = await adminApi.get<PaginatedResponse<Project>>('/admin/projects', { params: { page } });
      setProjects(data.data);
      setCurrentPage(data.current_page);
      setLastPage(data.last_page);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(1); }, [fetchProjects]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    try {
      await adminApi.delete(`/admin/projects/${pendingDelete.id}`);
      showToast('Project deleted successfully.');
      setPendingDelete(null);
      await fetchProjects(currentPage);
    } catch {
      showToast('Failed to delete project.', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout title="Projects">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Projects</h2>
          <p className="mt-0.5 text-sm text-gray-500">{total} total projects</p>
        </div>
      </div>

      <ToastBanner />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : projects.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No projects found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Project</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Owner</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Todos</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map(project => (
                <tr key={project.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
                      <span className="font-medium text-gray-800">{project.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{project.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{project.todos_count ?? 0}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(project.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setPendingDelete(project)}
                      disabled={deletingId === project.id}
                      className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {deletingId === project.id ? 'Deleting…' : 'Delete'}
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
          <button onClick={() => fetchProjects(currentPage - 1)} disabled={currentPage === 1}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {currentPage} of {lastPage}</span>
          <button onClick={() => fetchProjects(currentPage + 1)} disabled={currentPage === lastPage}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
            Next
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete Project"
        message={`Delete project "${pendingDelete?.name}"? Todos in this project will not be deleted. This action cannot be undone.`}
        isLoading={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
