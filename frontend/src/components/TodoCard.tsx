import type { Todo } from '../types';
import StatusBadge from './StatusBadge';

interface Props {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (id: number) => void;
}

export default function TodoCard({ todo, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md overflow-hidden">
      {todo.image_url && (
        <img
          src={todo.image_url}
          alt={todo.title}
          className="h-48 w-full object-cover"
        />
      )}

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-800">{todo.title}</h3>
          <StatusBadge status={todo.status} />
        </div>

        {todo.description && (
          <p className="mb-3 text-sm text-gray-500">{todo.description}</p>
        )}

        {todo.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {todo.tags.map((tag) => (
              <span key={tag.id} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(todo)}
            className="rounded bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
