import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

export default function NotFoundScreen() {
  const { colors } = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.background }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.onBackground }}>This screen doesn't exist.</Text>

        <Link href="/(tabs)/regattas" style={styles.link}>
          <Text style={{ fontSize: 14, color: colors.primary }}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = {
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
};
