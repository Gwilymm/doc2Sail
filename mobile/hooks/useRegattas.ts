import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../services/api';

export type Regatta = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  description?: string | null;
  accessToken: string | null;
  createdAt: string;
  owner: { id: number; displayName: string | null };
  coOwners: { id: number; displayName: string | null }[];
};

export function useRegattas() {
  const [regattas, setRegattas] = useState<Regatta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      if (__DEV__) await new Promise((r) => setTimeout(r, 1000));
      const res = await apiFetch('/api/regattas');
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setRegattas(data['member'] ?? data['hydra:member'] ?? data);
    } catch (e: any) {
      setError(e.message ?? 'Erreur réseau');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    regattas,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
  };
}
