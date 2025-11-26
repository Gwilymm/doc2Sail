import * as React from 'react';
import { api, AuthStorage, type User } from './api';
import * as LocalAuthentication from 'expo-local-authentication';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  requestCode: (
    email: string,
    displayName?: string
  ) => Promise<{ success: boolean; message: string }>;
  verifyCode: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Vérifier si l'utilisateur est déjà connecté au démarrage
  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AuthStorage.getAccessToken();
      console.log('[Auth] Token au démarrage:', token);
      if (!token) {
        // Pas de token, utilisateur non connecté
        setIsLoading(false);
        return;
      }

      // Vérification biométrique avant d'utiliser le token
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        const biometricResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authentifiez-vous pour accéder à Doc2Sail',
          fallbackLabel: 'Utiliser le code',
        });
        if (!biometricResult.success) {
          setIsLoading(false);
          return;
        }
      }

      // Essayer de récupérer les infos utilisateur
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      // En cas d'erreur, nettoyer les tokens et considérer l'utilisateur comme déconnecté
      await AuthStorage.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const requestCode = async (email: string, displayName?: string) => {
    try {
      const result = await api.requestMagicLink(email, displayName);
      return result;
    } catch (error) {
      console.error('Request code failed:', error);
      throw error;
    }
  };

  const verifyCode = async (code: string) => {
    try {
      const result = await api.verifyCode(code);
      setUser(result.user);
    } catch (error) {
      console.error('Verify code failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await api.logout();
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, requestCode, verifyCode, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
