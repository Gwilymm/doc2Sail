import '../global.css';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider as AppThemeProvider } from '../context/ThemeContext';
import { useAppTheme } from '../theme/useAppTheme';

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

    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === '(auth)';
    const inPublicGroup = firstSegment === 'public' || firstSegment === 'r' || firstSegment === 'document-viewer';

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
  const { colors } = useAppTheme();
  const navigationTheme = {
    dark: colors.isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.onSurface,
      border: colors.outlineVariant,
      notification: colors.error,
    },
    fonts: DefaultTheme.fonts,
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <AuthGuard>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="public/[token]" options={{ headerShown: false }} />
          <Stack.Screen name="r/[token]" options={{ headerShown: false }} />
          <Stack.Screen name="document-viewer" options={{ presentation: 'modal' }} />
          <Stack.Screen name="regattas/new" options={{ presentation: 'modal', title: 'Nouvelle régate' }} />
          <Stack.Screen name="regattas/scan" options={{ presentation: 'modal', title: 'Scanner' }} />
          <Stack.Screen name="regattas/[id]/upload" options={{ presentation: 'modal', title: 'Ajouter un fichier' }} />
          <Stack.Screen name="regattas/[id]/share" options={{ presentation: 'modal', title: 'Partager' }} />
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
