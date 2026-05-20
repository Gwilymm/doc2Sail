import { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useRegattas } from '../../../hooks/useRegattas';
import { RegattaCard } from '../../../components/RegattaCard';
import { SkeletonCard } from '../../../components/SkeletonCard';
import { useAuth } from '../../../context/AuthContext';
import { useAppTheme } from '../../../theme/useAppTheme';
import { AppHeader } from '../../../components/AppHeader';

export default function RegattasScreen() {
  const { regattas, loading, refreshing, loadingMore, hasMore, error, refresh, loadMore } = useRegattas();
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [activeScope, setActiveScope] = useState<'all' | 'mine' | 'shared'>('all');

  const ownershipById = useMemo(() => {
    const entries = regattas.map((regatta) => [
      regatta.id,
      regatta.owner.id === user?.id ? 'owner' : 'shared',
    ] as const);

    return new Map(entries);
  }, [regattas, user?.id]);

  const counts = useMemo(() => {
    let mine = 0;
    let shared = 0;

    regattas.forEach((regatta) => {
      if (regatta.owner.id === user?.id) mine += 1;
      else shared += 1;
    });

    return { all: regattas.length, mine, shared };
  }, [regattas, user?.id]);

  const visibleRegattas = useMemo(() => {
    if (activeScope === 'mine') {
      return regattas.filter((regatta) => regatta.owner.id === user?.id);
    }
    if (activeScope === 'shared') {
      return regattas.filter((regatta) => regatta.owner.id !== user?.id);
    }
    return regattas;
  }, [activeScope, regattas, user?.id]);

  const scopeOptions = [
    { key: 'all' as const, label: 'Toutes', count: counts.all },
    { key: 'mine' as const, label: 'Mes régates', count: counts.mine },
    { key: 'shared' as const, label: 'Partagées', count: counts.shared },
  ];

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader
        title="Régates"
        subtitle={user?.displayName ? `Bonjour, ${user.displayName}` : 'Documents et partages de régates'}
      />

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
          data={visibleRegattas}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {scopeOptions.map((option) => {
                const selected = activeScope === option.key;

                return (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setActiveScope(option.key)}
                    activeOpacity={0.75}
                    style={{
                      flex: 1,
                      minHeight: 44,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : colors.outlineVariant,
                      backgroundColor: selected ? colors.primaryContainer : colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 8,
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? colors.onPrimaryContainer : colors.onSurface,
                        fontSize: 13,
                        fontWeight: '800',
                      }}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={{
                        color: selected ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      {option.count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          }
          contentContainerStyle={{
            padding: 16,
            gap: 12,
            flexGrow: 1,
            ...(Platform.OS === 'web' ? { maxWidth: 800, width: '100%', alignSelf: 'center' } : {}),
          }}
          renderItem={({ item }) => (
            <RegattaCard
              regatta={item}
              ownership={ownershipById.get(item.id) ?? 'owner'}
              onPress={() => router.push(`/(tabs)/regattas/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
              <Text style={{ fontSize: 48 }}>⛵</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.onSurface, marginTop: 16 }}>
                {activeScope === 'shared' ? 'Aucune régate partagée' : activeScope === 'mine' ? 'Aucune régate à vous' : 'Aucune régate'}
              </Text>
              <Text style={{ fontSize: 14, color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 }}>
                {activeScope === 'shared'
                  ? 'Les régates partagées avec vous apparaîtront ici.'
                  : 'Créez votre première régate depuis le menu +.'}
              </Text>
            </View>
          }
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}
