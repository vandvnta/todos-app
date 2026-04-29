import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { Comment } from '../types';

interface Props {
  postId: string | number;
}

export default function CommentSection({ postId }: Props) {
  const { user } = useAuth();

  const [comments, setComments]   = useState<Comment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [content, setContent]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    api.get<{ data: Comment[] }>(`/posts/${postId}/comments`)
      .then(({ data }) => setComments(data.data))
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post<{ data: Comment }>(`/posts/${postId}/comments`, { content });
      setComments((prev) => [...prev, data.data]);
      setContent('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await api.delete(`/comments/${id}`);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  function canDelete(comment: Comment) {
    if (!user) return false;
    return comment.user_id === user.id || user.role === 'admin';
  }

  return (
    <section className="mt-10 border-t border-gray-200 pt-8">
      <h2 className="mb-6 text-lg font-semibold text-gray-800">
        Comments{!loading && ` (${comments.length})`}
      </h2>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-gray-400">No comments yet. Be the first!</p>
          )}
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{comment.user.name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </span>
                </div>
                {canDelete(comment) && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="mt-6">
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment…"
            maxLength={2000}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">{content.length}/2000</span>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Posting…' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-6 text-sm text-gray-500">
          <a href="/login" className="text-blue-600 hover:underline">Log in</a> to leave a comment.
        </p>
      )}
    </section>
  );
}
