import { useCallback, useEffect, useState } from 'react';
import adminApi from '../../api/adminAxios';
import AdminLayout from '../../layouts/AdminLayout';
import type { ActivityLog, PaginatedResponse } from '../../types';

export default function ActivityLogsPage() {
  const [logs, setLogs]               = useState<ActivityLog[]>([]);
  const [loading, setLoading]         = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage]       = useState(1);
  const [total, setTotal]             = useState(0);

  const fetchLogs = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const { data } = await adminApi.get<PaginatedResponse<ActivityLog>>('/admin/activity-logs', { params: { page } });
      setLogs(data.data);
      setCurrentPage(data.current_page);
      setLastPage(data.last_page);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  return (
    <AdminLayout title="Activity Logs">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Activity Logs</h2>
        <p className="mt-0.5 text-sm text-gray-500">{total} total events</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No activity logs found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Subject</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{log.user?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{log.action}</span>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-700">{log.description}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{log.subject_type} #{log.subject_id}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {lastPage > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => fetchLogs(currentPage - 1)} disabled={currentPage === 1}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {currentPage} of {lastPage}</span>
          <button onClick={() => fetchLogs(currentPage + 1)} disabled={currentPage === lastPage}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
