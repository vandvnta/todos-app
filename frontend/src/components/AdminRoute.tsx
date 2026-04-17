import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { admin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!admin) return <Navigate to="/admin/login" replace />;
  if (admin.role !== 'admin') return <Navigate to="/todos" replace />;

  return <>{children}</>;
}
