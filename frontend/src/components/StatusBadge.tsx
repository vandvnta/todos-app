import type { TodoStatus } from '../types';

const config: Record<TodoStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-800',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800',
  },
};

export default function StatusBadge({ status }: { status: TodoStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
