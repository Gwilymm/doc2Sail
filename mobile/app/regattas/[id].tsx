import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function RegattaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // TODO S2-J7 : charger GET /api/regattas/{id} + liste documents
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0284c7" />
      <Text style={styles.label}>Régate #{id}</Text>
      <Text style={styles.hint}>Semaine 2 — J7</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  label: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  hint: { fontSize: 13, color: '#9ca3af' },
});
