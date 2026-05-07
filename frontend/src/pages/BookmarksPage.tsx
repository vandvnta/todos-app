import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ToastBanner from '../components/ToastBanner';
import { useToast } from '../context/ToastContext';
import type { PaginatedResponse, Post } from '../types';
import DOMPurify from 'dompurify';

export default function BookmarksPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [posts, setPosts]             = useState<Post[]>([]);
  const [loading, setLoading]         = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage]       = useState(1);
  const [total, setTotal]             = useState(0);

  const fetchBookmarks = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const { data } = await api.get<PaginatedResponse<Post>>('/bookmarks', { params: { page } });
      setPosts(data.data);
      setCurrentPage(data.current_page);
      setLastPage(data.last_page);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookmarks(1); }, [fetchBookmarks]);

  async function handleUnbookmark(postId: number) {
    try {
      await api.post(`/posts/${postId}/bookmarks`);
      setPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Bookmark removed.');
    } catch {
      showToast('Failed to remove bookmark.', 'error');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <button onClick={() => navigate('/posts')} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Bookmarks</h1>
          {total > 0 && <span className="ml-auto text-sm text-gray-400">{total} saved</span>}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <ToastBanner />

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : posts.length === 0 ? (
          <p className="py-16 text-center text-gray-400">No bookmarks yet.</p>
        ) : (
          <>
            {posts.map(post => (
              <div key={post.id} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                {post.image_url && (
                  <img src={post.image_url} alt={post.title} className="h-20 w-20 flex-shrink-0 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex flex-wrap gap-1">
                    {post.categories.map(cat => (
                      <span key={cat.id} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{cat.name}</span>
                    ))}
                  </div>
                  <Link to={`/posts/${post.id}`} className="font-semibold text-gray-800 hover:text-blue-600 line-clamp-1">
                    {post.title}
                  </Link>
                  <div
                    className="mt-1 text-xs text-gray-500 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                  />
                  <p className="mt-1 text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleUnbookmark(post.id)}
                  className="flex-shrink-0 self-start rounded-lg p-1.5 text-amber-500 hover:bg-amber-50"
                  title="Remove bookmark"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 20V4z" />
                  </svg>
                </button>
              </div>
            ))}

            {lastPage > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button onClick={() => fetchBookmarks(currentPage - 1)} disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  Previous
                </button>
                <span className="text-sm text-gray-500">Page {currentPage} of {lastPage}</span>
                <button onClick={() => fetchBookmarks(currentPage + 1)} disabled={currentPage === lastPage}
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
