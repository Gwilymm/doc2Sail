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

function extractNextUrl(data: any): string | null {
  const view = data['hydra:view'] ?? data['view'];
  const next = view?.['hydra:next'] ?? view?.['next'];
  return next ?? null;
}

export function useRegattas() {
  const [regattas, setRegattas] = useState<Regatta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      if (__DEV__) await new Promise((r) => setTimeout(r, 600));
      const res = await apiFetch('/api/regattas');
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setRegattas(data['member'] ?? data['hydra:member'] ?? data);
      setNextUrl(extractNextUrl(data));
    } catch (e: any) {
      setError(e.message ?? 'Erreur réseau');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextUrl || loadingMore) return;
    setLoadingMore(true);

    try {
      const res = await apiFetch(nextUrl);
      if (!res.ok) return;
      const data = await res.json();
      const newItems: Regatta[] = data['member'] ?? data['hydra:member'] ?? [];
      setRegattas((prev) => [...prev, ...newItems]);
      setNextUrl(extractNextUrl(data));
    } catch {
      // silently ignore load-more errors to not break the list
    } finally {
      setLoadingMore(false);
    }
  }, [nextUrl, loadingMore]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    regattas,
    loading,
    refreshing,
    loadingMore,
    hasMore: nextUrl !== null,
    error,
    refresh: () => load(true),
    loadMore,
  };
}
