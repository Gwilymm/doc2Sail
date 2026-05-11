import { Stack } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';

export default function RegattasLayout() {
  const { isDark } = useTheme();

  const headerStyle = {
    backgroundColor: isDark ? '#082437' : '#FFFFFF',
  } as const;

  const headerTintColor = isDark ? '#8BD3E8' : '#0B4F6C';

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
