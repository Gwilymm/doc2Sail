import { useState, useEffect, useCallback } from 'react';
import { getToken, clearTokens, apiFetch } from '../services/api';

type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: { email: string; id: number } | null;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
  });

  const checkAuth = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));
    const token = await getToken();

    if (!token) {
      setState({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      const res = await apiFetch('/api/me');
      if (res.ok) {
        const user = await res.json();
        setState({ isLoading: false, isAuthenticated: true, user });
      } else {
        setState({ isLoading: false, isAuthenticated: false, user: null });
      }
    } catch {
      setState({ isLoading: false, isAuthenticated: false, user: null });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    await clearTokens();
    setState({ isLoading: false, isAuthenticated: false, user: null });
  }, []);

  return { ...state, checkAuth, logout };
}
