import { API_BASE_URL, setToken, setRefreshToken, clearTokens } from './api';

export async function requestMagicLink(email: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/auth/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Erreur lors de l\'envoi du code');
  }
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

// Dev only — obtenir un short code sans email
export async function devGetCode(email: string): Promise<string> {
  if (!__DEV__) throw new Error('Dev only');
  const res = await fetch(`${API_BASE_URL}/api/auth/dev/magic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  return data.shortCode;
}
