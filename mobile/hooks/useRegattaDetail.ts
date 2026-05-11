import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../services/api';
import { Regatta } from './useRegattas';

export type Document = {
  id: number;
  name: string;
  filename: string;
  mimeType: string;
  size: number;
  category: string;
  uploadedAt: string;
};

export function useRegattaDetail(id: string | number) {
  const [regatta, setRegatta] = useState<Regatta | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        if (__DEV__) await new Promise((r) => setTimeout(r, 1000));
        const [regattaRes, docsRes] = await Promise.all([
          apiFetch(`/api/regattas/${id}`),
          apiFetch(`/api/regattas/${id}/documents`),
        ]);

        if (!regattaRes.ok) throw new Error('Impossible de charger la régate');
        if (!docsRes.ok) throw new Error('Impossible de charger les documents');

        const [regattaData, docsData] = await Promise.all([
          regattaRes.json(),
          docsRes.json(),
        ]);

        setRegatta(regattaData);
        setDocuments(docsData['member'] ?? docsData['hydra:member'] ?? []);
      } catch (e: any) {
        setError(e.message ?? 'Erreur réseau');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    regatta,
    documents,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
  };
}
