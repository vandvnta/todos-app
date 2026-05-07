import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ToastBanner from '../components/ToastBanner';
import { useToast } from '../context/ToastContext';
import type { Notification, PaginatedResponse } from '../types';

interface NotificationsResponse {
  notifications: PaginatedResponse<Notification>;
  unread_count: number;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [currentPage, setCurrentPage]     = useState(1);
  const [lastPage, setLastPage]           = useState(1);
  const [unreadCount, setUnreadCount]     = useState(0);

  async function fetchNotifications(page: number) {
    setLoading(true);
    try {
      const { data } = await api.get<NotificationsResponse>('/notifications', { params: { page } });
      setNotifications(data.notifications.data);
      setCurrentPage(data.notifications.current_page);
      setLastPage(data.notifications.last_page);
      setUnreadCount(data.unread_count);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchNotifications(1); }, []);

  async function markAsRead(id: number) {
    await api.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function markAllAsRead() {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
  }

  async function deleteNotification(id: number) {
    try {
      const n = notifications.find(x => x.id === id);
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(x => x.id !== id));
      if (n && !n.read_at) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      showToast('Failed to delete notification.', 'error');
    }
  }

  function notifLabel(n: Notification) {
    if (n.type === 'new_comment') {
      return `${n.data.commenter_name} commented on "${n.data.post_title}"`;
    }
    return n.type;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{unreadCount}</span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <ToastBanner />

        {unreadCount > 0 && (
          <div className="flex justify-end">
            <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:underline">
              Mark all as read
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="py-16 text-center text-gray-400">No notifications.</p>
        ) : (
          <>
            <div className="space-y-2">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm ${
                    n.read_at ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{notifLabel(n)}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-shrink-0 gap-3">
                    {!n.read_at && (
                      <button onClick={() => markAsRead(n.id)} className="text-xs text-blue-600 hover:underline">
                        Mark read
                      </button>
                    )}
                    <button onClick={() => deleteNotification(n.id)} className="text-xs text-red-500 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {lastPage > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button onClick={() => fetchNotifications(currentPage - 1)} disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  Previous
                </button>
                <span className="text-sm text-gray-500">Page {currentPage} of {lastPage}</span>
                <button onClick={() => fetchNotifications(currentPage + 1)} disabled={currentPage === lastPage}
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
