import { View, Text, FlatList, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useRegattas } from '../../../hooks/useRegattas';
import { RegattaCard } from '../../../components/RegattaCard';
import { SkeletonCard } from '../../../components/SkeletonCard';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

export default function RegattasScreen() {
  const { regattas, loading, refreshing, loadingMore, hasMore, error, refresh, loadMore } = useRegattas();
  const { user } = useAuth();
  const router = useRouter();
  const { isDark } = useTheme();

  const colors = isDark ? {
    background:       '#061B29',
    surface:          '#082437',
    onSurface:        '#EAF7FA',
    onSurfaceVariant: '#78919A',
    outlineVariant:   '#31515D',
  } : {
    background:       '#F6FAFB',
    surface:          '#FFFFFF',
    onSurface:        '#071D2B',
    onSurfaceVariant: '#4A6572',
    outlineVariant:   '#D3E0E4',
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
          paddingTop: 56,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.outlineVariant,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0 : 0.05,
          shadowRadius: 3,
          elevation: isDark ? 0 : 2,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.onSurface }}>Régates</Text>
        {user?.displayName ? (
          <Text style={{ fontSize: 14, color: colors.onSurfaceVariant, marginTop: 2 }}>
            Bonjour, {user.displayName} 👋
          </Text>
        ) : null}
      </View>

      {loading ? (
        <View style={{ padding: 16, gap: 12 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.onSurface, marginTop: 16, textAlign: 'center' }}>
            Erreur de chargement
          </Text>
          <Text style={{ fontSize: 14, color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={regattas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            padding: 16,
            gap: 12,
            flexGrow: 1,
            ...(Platform.OS === 'web' ? { maxWidth: 800, width: '100%', alignSelf: 'center' } : {}),
          }}
          renderItem={({ item }) => (
            <RegattaCard
              regatta={item}
              onPress={() => router.push(`/(tabs)/regattas/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
              <Text style={{ fontSize: 48 }}>⛵</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.onSurface, marginTop: 16 }}>Aucune régate</Text>
              <Text style={{ fontSize: 14, color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 }}>
                Créez votre première régate depuis le menu +.
              </Text>
            </View>
          }
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator color={isDark ? '#8BD3E8' : '#0B4F6C'} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={isDark ? '#8BD3E8' : '#0B4F6C'}
            />
          }
        />
      )}
    </View>
  );
}
