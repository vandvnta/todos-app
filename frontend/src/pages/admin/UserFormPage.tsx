import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../api/adminAxios';
import AdminLayout from '../../layouts/AdminLayout';
import { useToast } from '../../context/ToastContext';
import type { User, UserRole } from '../../types';

interface FormState {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: UserRole;
}

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'user',
};

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm]         = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors]     = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;

    adminApi.get<User>(`/admin/users/${id}`)
      .then(({ data }) => {
        setForm({
          name: data.name,
          email: data.email,
          password: '',
          password_confirmation: '',
          role: data.role,
        });
      })
      .catch(() => navigate('/admin/users'))
      .finally(() => setFetching(false));
  }, [id, isEdit, navigate]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isEdit) {
        const payload: Partial<FormState> = {
          name: form.name,
          email: form.email,
          role: form.role,
        };
        await adminApi.put(`/admin/users/${id}`, payload);
      } else {
        await adminApi.post('/admin/users', form);
      }
      showToast(isEdit ? 'User updated successfully.' : 'User created successfully.');
      navigate('/admin/users');
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response;
      if (response?.data?.errors) {
        const flat: Partial<Record<keyof FormState, string>> = {};
        for (const [key, messages] of Object.entries(response.data.errors)) {
          flat[key as keyof FormState] = messages[0];
        }
        setErrors(flat);
      } else {
        setErrors({ name: response?.data?.message ?? 'Something went wrong.' });
      }
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <AdminLayout title={isEdit ? 'Edit User' : 'New User'}>
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Users
          </button>
          <h2 className="text-xl font-bold text-gray-800">
            {isEdit ? 'Edit User' : 'New User'}
          </h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
            </div>

            {/* Password — only for create */}
            {!isEdit && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="password_confirmation"
                    value={form.password_confirmation}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
