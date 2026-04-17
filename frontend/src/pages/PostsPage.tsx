import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { Category, PaginatedResponse, Post } from '../types';
import DOMPurify from "dompurify";

export default function PostsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts]             = useState<Post[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [loading, setLoading]         = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage]       = useState(1);
  const [total, setTotal]             = useState(0);

  const activeCategoryId = searchParams.get('category_id') ?? '';

  const fetchPosts = useCallback(async (page: number, categoryId: string) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (categoryId) params.category_id = categoryId;
      const { data } = await api.get<PaginatedResponse<Post>>('/posts', { params });
      setPosts(data.data);
      setCurrentPage(data.current_page);
      setLastPage(data.last_page);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get<Category[]>('/categories').then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    fetchPosts(1, activeCategoryId);
  }, [fetchPosts, activeCategoryId]);

  function handleCategoryFilter(id: string) {
    setSearchParams(id ? { category_id: id } : {});
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-800">Blog</h1>
            <nav className="flex items-center gap-4">
              <Link to="/todos" className="text-sm text-gray-500 hover:text-gray-700">My Todos</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.name}</span>
            {user?.role === 'admin' && (
              <Link
                to="/admin/posts"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-purple-300 px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-purple-50"
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={logout}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Category filter */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleCategoryFilter('')}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              !activeCategoryId ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCategoryFilter(String(c.id))}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                activeCategoryId === String(c.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <p className="mb-4 text-sm text-gray-500">{total} posts</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center text-gray-400">No posts found.</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/posts/${post.id}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="h-44 w-full object-cover transition group-hover:opacity-95"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-gray-100">
                    <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  {post.categories.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {post.categories.map((cat) => (
                        <span key={cat.id} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="mb-2 font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600">
                    {post.title}
                  </h2>
                  <div
                    className="prose prose-sm prose-gray max-w-none line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                  />
                  <p className="mt-auto pt-3 text-xs text-gray-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {lastPage > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => fetchPosts(currentPage - 1, activeCategoryId)}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {currentPage} of {lastPage}</span>
            <button
              onClick={() => fetchPosts(currentPage + 1, activeCategoryId)}
              disabled={currentPage === lastPage}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
