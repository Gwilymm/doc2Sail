import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Configuration de l'API
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.2:8000/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthTokens {
  token: string;
  refresh_token: string;
  expires_in: number;
}

interface User {
  id: number;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
}

interface Regatta {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  createdAt: string;
  accessToken?: string;
  owner: {
    id: number;
    displayName?: string;
  };
  coOwners?: Array<{
    id: number;
    displayName?: string;
  }>;
}

// Gestion du stockage sécurisé des tokens (compatible web)
export const AuthStorage = {
  async setTokens(tokens: AuthTokens) {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('access_token', tokens.token);
        localStorage.setItem('refresh_token', tokens.refresh_token);
      } else {
        await SecureStore.setItemAsync('access_token', tokens.token);
        await SecureStore.setItemAsync('refresh_token', tokens.refresh_token);
      }
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem('access_token');
      }
      return await SecureStore.getItemAsync('access_token');
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem('refresh_token');
      }
      return await SecureStore.getItemAsync('refresh_token');
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  async clearTokens() {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } else {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },
};

// Client API
export const api = {
  // Demander un code de connexion par email
  async requestMagicLink(
    email: string,
    displayName?: string
  ): Promise<{ success: boolean; expiresIn: number; message: string }> {
    const response = await fetch(`${API_URL}/api/auth/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, displayName }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Failed to request magic link');
    }

    return response.json();
  },

  // Vérifier le code et obtenir le token
  async verifyCode(code: string): Promise<{ token: string; user: User }> {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Verification failed' }));
      throw new Error(error.error || 'Invalid or expired code');
    }

    const data = await response.json();

    // Stocker le token (pas de refresh_token avec magic link)
    await AuthStorage.setTokens({
      token: data.token,
      refresh_token: '', // Pas utilisé avec magic link
      expires_in: 3600,
    });

    return data;
  },

  // Ancienne méthode login conservée pour compatibilité (si vous l'utilisez ailleurs)
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Invalid credentials');
    }

    const data = await response.json();
    await AuthStorage.setTokens(data);
    return data;
  },

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = await AuthStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_URL}/api/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    await AuthStorage.setTokens(data);
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const token = await AuthStorage.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_URL}/api/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        await api.refreshToken();
        return api.getCurrentUser();
      }
      throw new Error('Failed to fetch user');
    }

    return response.json();
  },

  async logout() {
    await AuthStorage.clearTokens();
  },

  // Récupérer la liste des régates de l'utilisateur
  async getMyRegattas(): Promise<Regatta[]> {
    const token = await AuthStorage.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_URL}/api/regattas`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await api.refreshToken();
        return api.getMyRegattas();
      }
      throw new Error('Failed to fetch regattas');
    }

    const data = await response.json();
    // API Platform retourne les données dans 'hydra:member'
    return data['hydra:member'] || data;
  },

  // Créer une nouvelle régate
  async createRegatta(regatta: {
    name: string;
    startDate: string;
    endDate: string;
    description?: string;
  }): Promise<Regatta> {
    const token = await AuthStorage.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_URL}/api/regattas`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(regatta),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create regatta' }));
      throw new Error(error.error || error.message || 'Failed to create regatta');
    }

    return response.json();
  },
};

export type { User, Regatta };
