import { Stack } from 'expo-router';
import { useAppTheme } from '../../../theme/useAppTheme';

export default function RegattasLayout() {
  const { colors } = useAppTheme();

  const headerStyle = {
    backgroundColor: colors.surface,
  } as const;

  const headerTintColor = colors.primary;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: '',
          headerStyle,
          headerTintColor,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
