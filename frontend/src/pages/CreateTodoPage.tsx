import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import TodoForm from '../components/TodoForm';
import { useToast } from '../context/ToastContext';
import type { Todo, TodoFormData } from '../types';

export default function CreateTodoPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  async function handleSubmit(data: TodoFormData) {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('status', data.status);
    if (data.image) formData.append('image', data.image);
    if (data.projectId) formData.append('project_id', String(data.projectId));
    data.tagIds.forEach((id) => formData.append('tag_ids[]', String(id)));

    try {
      await api.post<Todo>('/todos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Todo created successfully.');
      navigate('/todos');
    } catch {
      showToast('Failed to create todo.', 'error');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate('/todos')}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Back"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">New Todo</h1>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <TodoForm
            onSubmit={handleSubmit}
            onCancel={() => navigate('/todos')}
          />
        </div>
      </main>
    </div>
  );
}
