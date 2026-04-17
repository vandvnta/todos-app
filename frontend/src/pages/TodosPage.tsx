import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import TodoCard from '../components/TodoCard';
import { useAuth } from '../context/AuthContext';
import type { Todo, TodoStatus } from '../types';

type Filter = 'all' | TodoStatus;

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all',         label: 'All' },
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
];

export default function TodosPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [todos, setTodos]     = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<Filter>('all');

  const fetchTodos = useCallback(async () => {
    const { data } = await api.get<Todo[]>('/todos');
    setTodos(data);
  }, []);

  useEffect(() => {
    fetchTodos().finally(() => setLoading(false));
  }, [fetchTodos]);

  async function handleDelete(id: number) {
    if (!confirm('Delete this todo?')) return;
    await api.delete(`/todos/${id}`);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  const filtered = filter === 'all' ? todos : todos.filter((t) => t.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">My Todos</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <Link
              to="/posts"
              className="text-sm font-medium text-gray-600 hover:text-blue-600"
            >
              Blog
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin/users"
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

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Actions row */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {/* Filter tabs */}
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                  filter === opt.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/todos/new')}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Todo
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            {filter === 'all' ? 'No todos yet. Create one!' : `No ${filter.replace('_', ' ')} todos.`}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onEdit={(todo) => navigate(`/todos/${todo.id}/edit`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
