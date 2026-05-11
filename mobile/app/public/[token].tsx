import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function PublicRegattaScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();

  // TODO S3-J13 : vue publique sans auth via /r/{token}
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🏆</Text>
      <Text style={styles.label}>Vue publique</Text>
      <Text style={styles.token}>{token}</Text>
      <Text style={styles.hint}>Semaine 3 — J13</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emoji: { fontSize: 48 },
  label: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  token: { fontSize: 12, color: '#9ca3af', fontFamily: 'SpaceMono' },
  hint: { fontSize: 13, color: '#9ca3af' },
});
