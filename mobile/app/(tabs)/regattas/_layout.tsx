import { Stack } from 'expo-router';

export default function RegattasLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: true, title: '' }} />
    </Stack>
  );
}
