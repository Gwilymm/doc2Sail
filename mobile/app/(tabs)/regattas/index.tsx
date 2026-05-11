import { View, Text, FlatList, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useRegattas } from '../../../hooks/useRegattas';
import { RegattaCard } from '../../../components/RegattaCard';
import { SkeletonCard } from '../../../components/SkeletonCard';
import { useAuth } from '../../../context/AuthContext';

export default function RegattasScreen() {
  const { regattas, loading, refreshing, error, refresh } = useRegattas();
  const { user } = useAuth();
  const router = useRouter();

  return (
    <View className="flex-1 bg-base-200">
      {/* Header */}
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }}
      >
        <Text className="text-2xl font-bold text-base-content">Régates</Text>
        {user?.displayName ? (
          <Text className="text-sm text-gray-400 mt-0.5">Bonjour, {user.displayName} 👋</Text>
        ) : null}
      </View>

      {loading ? (
        <View className="p-4 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text className="text-base-content font-semibold text-lg mt-4 text-center">Erreur de chargement</Text>
          <Text className="text-gray-400 text-sm mt-1 text-center">{error}</Text>
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
            <View className="flex-1 items-center justify-center py-20">
              <Text style={{ fontSize: 48 }}>⛵</Text>
              <Text className="text-base-content font-semibold text-lg mt-4">Aucune régate</Text>
              <Text className="text-gray-400 text-sm mt-1 text-center px-8">
                Créez votre première régate depuis le menu +.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#0284c7" />
          }
        />
      )}
    </View>
  );
}
