import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import api from '../api/axios';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [token, setToken]       = useState<string | null>(() => localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from stored access token on mount
  useEffect(() => {
    if (token) {
      api.get<{ data: User }>('/me', { _skipRedirect: true } as never)
        .then(({ data }) => setUser(data.data))
        .catch(() => clearSession())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  function saveSession(accessToken: string, refreshToken: string, newUser: User) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setToken(accessToken);
    setUser(newUser);
  }

  function clearSession() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
  }

  async function login(email: string, password: string): Promise<User> {
    const { data } = await api.post('/login', { email, password });
    saveSession(data.access_token, data.refresh_token, data.user);
    return data.user as User;
  }

  async function register(
    name: string,
    email: string,
    password: string,
    password_confirmation: string
  ) {
    const { data } = await api.post('/register', {
      name,
      email,
      password,
      password_confirmation,
    });
    saveSession(data.access_token, data.refresh_token, data.user);
  }

  async function logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    await api.post('/logout', { refresh_token: refreshToken }).catch(() => {});
    clearSession();
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
