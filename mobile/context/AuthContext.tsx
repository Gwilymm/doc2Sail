import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, clearTokens, apiFetch } from '../services/api';

export type AuthUser = {
  id: number;
  displayName: string | null;
  roles: string[];
  regattasCount: number;
  sharedRegattasCount: number;
};

type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    const token = await getToken();

    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiFetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, user, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
