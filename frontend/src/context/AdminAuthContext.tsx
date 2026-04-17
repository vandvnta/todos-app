import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import adminApi from '../api/adminAxios';
import type { User } from '../types';

interface AdminAuthContextValue {
  admin: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin]       = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem('admin_access_token');

  useEffect(() => {
    if (token) {
      adminApi.get('/me')
        .then(({ data }) => setAdmin(data))
        .catch(() => clearSession())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  function saveSession(accessToken: string, refreshToken: string, user: User) {
    localStorage.setItem('admin_access_token', accessToken);
    localStorage.setItem('admin_refresh_token', refreshToken);
    setAdmin(user);
  }

  function clearSession() {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    setAdmin(null);
  }

  async function login(email: string, password: string): Promise<User> {
    const { data } = await adminApi.post('/login', { email, password });
    saveSession(data.access_token, data.refresh_token, data.user);
    return data.user as User;
  }

  async function logout() {
    const refreshToken = localStorage.getItem('admin_refresh_token');
    await adminApi.post('/logout', { refresh_token: refreshToken }).catch(() => {});
    clearSession();
  }

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
