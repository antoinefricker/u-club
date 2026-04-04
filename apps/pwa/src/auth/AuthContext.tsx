import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AuthContext } from './authContextValue';
import type { User } from '../types/User';

const TOKEN_KEY = 'access_token';

function parseJwtPayload(token: string): { sub: string; email: string } {
  const base64 = token.split('.')[1];
  const json = atob(base64);
  return JSON.parse(json);
}

async function fetchUser(userId: string, token: string): Promise<User> {
  const res = await fetch(`/api/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch user');
  }
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(
    () => !!localStorage.getItem(TOKEN_KEY),
  );

  useEffect(() => {
    if (!token) return;
    const { sub } = parseJwtPayload(token);
    fetchUser(sub, token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? 'Login failed');
    }

    const { accessToken: access_token } = await res.json();
    const { sub } = parseJwtPayload(access_token);
    const userData = await fetchUser(sub, access_token);

    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  const value = useMemo(
    () => ({ token, user, isAuthenticated: token !== null, login, logout }),
    [token, user, login, logout],
  );

  if (loading) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
