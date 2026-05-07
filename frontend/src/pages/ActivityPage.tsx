import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import type { ActivityLog, PaginatedResponse } from '../types';

export default function ActivityPage() {
  const navigate = useNavigate();

  const [logs, setLogs]               = useState<ActivityLog[]>([]);
  const [loading, setLoading]         = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage]       = useState(1);
  const [total, setTotal]             = useState(0);

  async function fetchLogs(page: number) {
    setLoading(true);
    try {
      const { data } = await api.get<PaginatedResponse<ActivityLog>>('/activity-logs', { params: { page } });
      setLogs(data.data);
      setCurrentPage(data.current_page);
      setLastPage(data.last_page);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLogs(1); }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Activity Log</h1>
          {total > 0 && <span className="ml-auto text-sm text-gray-400">{total} events</span>}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <p className="py-16 text-center text-gray-400">No activity yet.</p>
        ) : (
          <>
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{log.description}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {log.action}
                  </span>
                </div>
              ))}
            </div>

            {lastPage > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button onClick={() => fetchLogs(currentPage - 1)} disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  Previous
                </button>
                <span className="text-sm text-gray-500">Page {currentPage} of {lastPage}</span>
                <button onClick={() => fetchLogs(currentPage + 1)} disabled={currentPage === lastPage}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
