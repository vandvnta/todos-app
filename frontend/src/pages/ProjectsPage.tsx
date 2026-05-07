import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';
import ToastBanner from '../components/ToastBanner';
import { useToast } from '../context/ToastContext';
import type { Project } from '../types';

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#14b8a6'];

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [projects, setProjects]   = useState<Project[]>([]);
  const [loading, setLoading]     = useState(true);
  const [name, setName]           = useState('');
  const [color, setColor]         = useState(COLORS[0]);
  const [saving, setSaving]       = useState(false);
  const [editId, setEditId]       = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const { data } = await api.get<{ data: Project[] }>('/projects');
      setProjects(data.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        const { data } = await api.put<{ data: Project }>(`/projects/${editId}`, { name, color });
        setProjects(prev => prev.map(p => p.id === editId ? data.data : p));
        showToast('Project updated.');
      } else {
        const { data } = await api.post<{ data: Project }>('/projects', { name, color });
        setProjects(prev => [...prev, data.data]);
        showToast('Project created.');
      }
      setName(''); setColor(COLORS[0]); setEditId(null);
    } catch {
      showToast('Failed to save project.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p: Project) {
    setEditId(p.id); setName(p.name); setColor(p.color);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${pendingDelete.id}`);
      setProjects(prev => prev.filter(p => p.id !== pendingDelete.id));
      showToast('Project deleted.');
      setPendingDelete(null);
    } catch {
      showToast('Failed to delete project.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <button onClick={() => navigate('/todos')} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Projects</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <ToastBanner />

        {/* Form */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">{editId ? 'Edit Project' : 'New Project'}</h2>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="Project name…"
                maxLength={100}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-1.5">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border-2 transition ${color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
            </button>
            {editId && (
              <button onClick={() => { setEditId(null); setName(''); setColor(COLORS[0]); }} className="text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : projects.length === 0 ? (
          <p className="py-12 text-center text-gray-400">No projects yet.</p>
        ) : (
          <div className="space-y-2">
            {projects.map(p => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <span className="flex-1 font-medium text-gray-800">{p.name}</span>
                <span className="text-xs text-gray-400">{p.todos_count ?? 0} todos</span>
                <button onClick={() => navigate(`/todos?project_id=${p.id}`)} className="text-xs text-blue-600 hover:underline">View</button>
                <button onClick={() => startEdit(p)} className="text-xs text-gray-500 hover:text-gray-700">Edit</button>
                <button onClick={() => setPendingDelete(p)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
              </div>
            ))}
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete Project"
        message={`Delete project "${pendingDelete?.name}"? Todos in this project will not be deleted.`}
        isLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
