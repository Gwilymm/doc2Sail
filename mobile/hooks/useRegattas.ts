import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../services/api';

export type Regatta = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  accessToken: string;
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
      const res = await apiFetch('/api/regattas');
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setRegattas(data['hydra:member'] ?? data);
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
