import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// In Expo Go on a physical device, localhost = the phone itself.
// Constants.expoConfig.hostUri gives the Metro server host (= dev machine IP).
function getDevBaseUrl(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0]; // strip Metro port
    return `http://${host}:8000`;
  }
  return 'http://localhost:8000'; // simulator fallback
}

export const API_BASE_URL = __DEV__
  ? getDevBaseUrl()
  : 'https://doc2sail.com';

const TOKEN_KEY = 'jwt_token';
const REFRESH_KEY = 'refresh_token';

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function setRefreshToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(REFRESH_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(REFRESH_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(REFRESH_KEY);
  }
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearTokens(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function refreshJwt(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE_URL}/api/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    await clearTokens();
    return null;
  }

  const data = await res.json();
  await setToken(data.token);
  return data.token;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  let token = await getToken();

  const doRequest = (t: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/ld+json',
        Accept: 'application/ld+json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...(options.headers ?? {}),
      },
    });

  let res = await doRequest(token);

  if (res.status === 401) {
    token = await refreshJwt();
    if (token) {
      res = await doRequest(token);
    }
  }

  return res;
}
