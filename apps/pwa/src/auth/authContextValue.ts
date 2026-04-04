import { createContext } from 'react';

export interface User {
  id: string;
  display_name: string;
  bio: string | null;
  phone: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextValue {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
