import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import CommentSection from '../components/CommentSection';
import type { Post } from '../types';
import DOMPurify from 'dompurify';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [post, setPost]       = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get<Post>(`/posts/${id}`)
      .then(({ data }) => setPost(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

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

        <h1 className="mb-6 text-3xl font-bold text-gray-900">{post.title}</h1>

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
