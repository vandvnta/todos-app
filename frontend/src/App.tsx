import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { useAuth } from './context/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import CategoryFormPage from './pages/admin/CategoryFormPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import CommentsPage from './pages/admin/CommentsPage';
import TagsPage from './pages/admin/TagsPage';
import PostFormPage from './pages/admin/PostFormPage';
import AdminPostsPage from './pages/admin/PostsPage';
import UserFormPage from './pages/admin/UserFormPage';
import UsersPage from './pages/admin/UsersPage';
import CreateTodoPage from './pages/CreateTodoPage';
import EditTodoPage from './pages/EditTodoPage';
import LoginPage from './pages/LoginPage';
import PostDetailPage from './pages/PostDetailPage';
import PostsPage from './pages/PostsPage';
import RegisterPage from './pages/RegisterPage';
import TodosPage from './pages/TodosPage';

function AdminSection() {
  return (
    <AdminAuthProvider>
      <AdminRoutes />
    </AdminAuthProvider>
  );
}

function AdminRoutes() {
  const { admin } = useAdminAuth();

  return (
    <Routes>
      <Route
        path="login"
        element={admin?.role === 'admin' ? <Navigate to="/admin/users" replace /> : <AdminLoginPage />}
      />
      <Route path="users"            element={<AdminRoute><UsersPage /></AdminRoute>} />
      <Route path="users/create"     element={<AdminRoute><UserFormPage /></AdminRoute>} />
      <Route path="users/:id/edit"   element={<AdminRoute><UserFormPage /></AdminRoute>} />
      <Route path="posts"            element={<AdminRoute><AdminPostsPage /></AdminRoute>} />
      <Route path="posts/create"     element={<AdminRoute><PostFormPage /></AdminRoute>} />
      <Route path="posts/:id/edit"   element={<AdminRoute><PostFormPage /></AdminRoute>} />
      <Route path="categories"       element={<AdminRoute><CategoriesPage /></AdminRoute>} />
      <Route path="categories/create"   element={<AdminRoute><CategoryFormPage /></AdminRoute>} />
      <Route path="categories/:id/edit" element={<AdminRoute><CategoryFormPage /></AdminRoute>} />
      <Route path="tags"             element={<AdminRoute><TagsPage /></AdminRoute>} />
      <Route path="comments"         element={<AdminRoute><CommentsPage /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/admin/users" replace />} />
    </Routes>
  );
}

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login"    element={user ? <Navigate to="/todos" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/todos" replace /> : <RegisterPage />} />

      <Route path="/todos"          element={<ProtectedRoute><TodosPage /></ProtectedRoute>} />
      <Route path="/todos/new"      element={<ProtectedRoute><CreateTodoPage /></ProtectedRoute>} />
      <Route path="/todos/:id/edit" element={<ProtectedRoute><EditTodoPage /></ProtectedRoute>} />

      <Route path="/posts"    element={<ProtectedRoute><PostsPage /></ProtectedRoute>} />
      <Route path="/posts/:id" element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />

      {/* Admin section — isolated auth context */}
      <Route path="/admin/*" element={<AdminSection />} />

      <Route path="*" element={<Navigate to={user ? '/todos' : '/login'} replace />} />
    </Routes>
  );
}
