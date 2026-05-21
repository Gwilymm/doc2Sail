import { API_BASE_URL, setToken, setRefreshToken, clearTokens } from './api';

export type MagicLinkRequestResponse = {
  success: boolean;
  alreadySent?: boolean;
  expiresIn?: number;
  message?: string;
};

export async function requestMagicLink(email: string, options: { force?: boolean } = {}): Promise<MagicLinkRequestResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, ...(options.force ? { force: true } : {}) }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Erreur lors de l\'envoi du code');
  }

  return res.json();
}

export async function verifyCode(code: string): Promise<{ token: string; refresh_token: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code.trim().toUpperCase() }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Code invalide ou expiré');
  }

  const data = await res.json();
  await setToken(data.token);
  await setRefreshToken(data.refresh_token);
  return data;
}

export async function logout(): Promise<void> {
  await clearTokens();
}
