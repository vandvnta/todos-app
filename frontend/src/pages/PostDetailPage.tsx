import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import CommentSection from '../components/CommentSection';
import type { Post } from '../types';
import DOMPurify from 'dompurify';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [post, setPost]           = useState<Post | null>(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [reacting, setReacting]   = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  useEffect(() => {
    api.get<Post>(`/posts/${id}`)
      .then(({ data }) => setPost(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleReaction() {
    if (!post || reacting) return;
    setReacting(true);
    try {
      const { data } = await api.post<{ reacted: boolean; reactions_count: number }>(`/posts/${post.id}/reactions`);
      setPost(prev => prev ? { ...prev, is_reacted: data.reacted, reactions_count: data.reactions_count } : prev);
    } finally {
      setReacting(false);
    }
  }

  async function toggleBookmark() {
    if (!post || bookmarking) return;
    setBookmarking(true);
    try {
      const { data } = await api.post<{ bookmarked: boolean }>(`/posts/${post.id}/bookmarks`);
      setPost(prev => prev ? { ...prev, is_bookmarked: data.bookmarked } : prev);
    } finally {
      setBookmarking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-lg font-medium text-gray-700">Post not found.</p>
        <Link to="/posts" className="text-sm text-blue-600 hover:underline">← Back to Blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Link to="/posts" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-800">Blog</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {post.image_url && (
          <img
            src={post.image_url}
            alt={post.title}
            className="mb-6 h-72 w-full rounded-xl object-cover shadow-sm"
          />
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {post.categories.map((cat) => (
            <span key={cat.id} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {cat.name}
            </span>
          ))}
          <span className="text-xs text-gray-400">
            {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        <h1 className="mb-4 text-3xl font-bold text-gray-900">{post.title}</h1>

        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={toggleReaction}
            disabled={reacting}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
              post.is_reacted
                ? 'border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100'
                : 'border-gray-300 bg-white text-gray-600 hover:border-rose-300 hover:text-rose-500'
            }`}
          >
            <svg className="h-4 w-4" fill={post.is_reacted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {post.reactions_count ?? 0}
          </button>

          <button
            onClick={toggleBookmark}
            disabled={bookmarking}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
              post.is_bookmarked
                ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100'
                : 'border-gray-300 bg-white text-gray-600 hover:border-amber-300 hover:text-amber-500'
            }`}
          >
            <svg className="h-4 w-4" fill={post.is_bookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {post.is_bookmarked ? 'Saved' : 'Save'}
          </button>
        </div>

        <div
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(post.content)
          }}
        />

        <CommentSection postId={post.id} />
      </main>
    </div>
  );
}
