import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '../context/ThemeContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inPublicGroup = segments[0] === 'public';

    if (!isAuthenticated && !inAuthGroup && !inPublicGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/regattas');
    }
  }, [isLoading, isAuthenticated, segments]);

  return <>{children}</>;
}

// Lit useTheme() (qui est dans AppThemeProvider) et passe le bon thème à React Navigation
function ThemedStack() {
  const { isDark } = useTheme();

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AuthGuard>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="public/[token]" options={{ headerShown: false }} />
          <Stack.Screen name="regattas/new" options={{ presentation: 'modal', title: 'Nouvelle régate' }} />
          <Stack.Screen name="regattas/[id]/upload" options={{ presentation: 'modal', title: 'Ajouter un fichier' }} />
        </Stack>
      </AuthGuard>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AppThemeProvider>
      <AuthProvider>
        <ThemedStack />
      </AuthProvider>
    </AppThemeProvider>
  );
}
