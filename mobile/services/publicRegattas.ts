import { API_BASE_URL, apiFetch } from './api';
import { Document } from '../hooks/useRegattaDetail';
import { Regatta } from '../hooks/useRegattas';

export type PublicDocument = Document & {
  description?: string | null;
  formattedSize?: string;
  viewUrl: string;
  fileUrl: string;
  downloadUrl: string;
};

export type PublicRegatta = Omit<Regatta, 'coOwners' | 'createdAt'> & {
  publicUrl: string;
  documents: PublicDocument[];
};

export type JoinedRegatta = {
  id: number;
  name: string;
  ownership: 'owner' | 'co_owner' | 'saved';
  alreadyLinked: boolean;
};

export function getPublicRegattaUrl(token: string): string {
  return `${API_BASE_URL}/r/${encodeURIComponent(token)}`;
}

export function getPublicDocumentFileUrl(token: string, documentId: number): string {
  return `${API_BASE_URL}/r/${encodeURIComponent(token)}/document/${documentId}/file`;
}

export function extractPublicRegattaToken(value: string): string | null {
  const raw = value.trim();

  if (/^[a-f0-9]{64}$/i.test(raw)) {
    return raw;
  }

  try {
    const url = new URL(raw);
    const match = url.pathname.match(/\/r\/([^/?#]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    const match = raw.match(/(?:^|\/)r\/([^/?#]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}

export async function fetchPublicRegatta(token: string): Promise<PublicRegatta> {
  const response = await fetch(`${API_BASE_URL}/r/${encodeURIComponent(token)}/data`, {
    headers: { Accept: 'application/json' },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Impossible de charger la régate publique');
  }

  return payload;
}

export async function joinPublicRegatta(token: string): Promise<JoinedRegatta> {
  const response = await apiFetch('/api/regattas/join-by-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Impossible d\'ajouter cette régate');
  }

  return payload;
}
