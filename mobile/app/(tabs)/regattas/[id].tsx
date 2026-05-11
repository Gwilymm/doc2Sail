import { ScrollView, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useState, useMemo } from 'react';
import { useRegattaDetail } from '../../../hooks/useRegattaDetail';
import { DocumentRow } from '../../../components/DocumentRow';
import { SkeletonCard } from '../../../components/SkeletonCard';

// --- Date helpers ---

function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString('fr-FR', { month: 'long' });
  const endMonth = end.toLocaleDateString('fr-FR', { month: 'long' });
  const year = end.getFullYear();

  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${startDay} – ${endDay} ${endMonth} ${year}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
}

// --- Screen ---

export default function RegattaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { regatta, documents, loading, refreshing, error, refresh } =
    useRegattaDetail(id);
  const [activeCategory, setActiveCategory] = useState<string>('Tous');

  const categories = useMemo(() => {
    const seen = new Set<string>();
    documents.forEach((d) => seen.add(d.category));
    return ['Tous', ...Array.from(seen)];
  }, [documents]);

  const filteredDocs = useMemo(
    () =>
      activeCategory === 'Tous'
        ? documents
        : documents.filter((d) => d.category === activeCategory),
    [documents, activeCategory]
  );

  // Loading state
  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Chargement…' }} />
        <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="p-4 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Erreur' }} />
        <View className="flex-1 bg-gray-50 items-center justify-center px-8 gap-3">
          <Text style={{ fontSize: 36 }}>⚠️</Text>
          <Text className="text-gray-800 font-semibold text-center text-base">
            Impossible de charger la régate
          </Text>
          <Text className="text-gray-500 text-sm text-center">{error}</Text>
        </View>
      </>
    );
  }

  if (!regatta) return null;

  const dateRange = formatDateRange(regatta.startDate, regatta.endDate);

  return (
    <>
      <Stack.Screen options={{ title: regatta.name }} />

      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#0284c7"
            colors={['#0284c7']}
          />
        }
      >
        {/* Header card */}
        <View
          className="bg-white px-5 py-5 gap-3"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          {/* Accent + title */}
          <View className="flex-row items-start gap-3">
            <View className="w-11 h-11 rounded-full bg-sky-50 items-center justify-center shrink-0 mt-0.5">
              <Text style={{ fontSize: 22, lineHeight: 26 }}>⛵</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-bold text-xl leading-snug">
                {regatta.name}
              </Text>
              <Text className="text-sky-600 text-sm mt-0.5">{dateRange}</Text>
            </View>
          </View>

          {/* Owner */}
          <View className="flex-row items-center gap-1.5">
            <Text className="text-gray-400 text-xs">Organisé par</Text>
            <Text className="text-gray-700 text-xs font-semibold">
              {regatta.owner.displayName ?? `Utilisateur #${regatta.owner.id}`}
            </Text>
          </View>

          {/* Description */}
          {regatta.description ? (
            <Text className="text-gray-600 text-sm leading-relaxed">
              {regatta.description}
            </Text>
          ) : null}
        </View>

        {/* M3 Secondary Tabs */}
        {documents.length > 0 && (
          <View
            style={{
              marginTop: 16,
              backgroundColor: '#FFFFFF',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(28,27,31,0.12)',
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row' }}
            >
              {categories.map((cat) => {
                const active = cat === activeCategory;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    activeOpacity={0.82}
                    style={{
                      height: 48,
                      paddingHorizontal: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        letterSpacing: 0.1,
                        color: active ? '#0284C7' : '#49454F',
                      }}
                    >
                      {cat}
                    </Text>
                    {active && (
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 2,
                          backgroundColor: '#0284C7',
                        }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Documents section label */}
        <View className="mt-3 px-4 mb-2">
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
            {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {documents.length === 0 ? (
          /* Empty state */
          <View
            className="mx-4 bg-white rounded-card py-10 items-center gap-2"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 32 }}>📂</Text>
            <Text className="text-gray-500 text-sm font-medium">Aucun document</Text>
            <Text className="text-gray-400 text-xs text-center px-8">
              Les documents partagés pour cette régate apparaîtront ici.
            </Text>
          </View>
        ) : filteredDocs.length === 0 ? (
          /* Empty filtered state */
          <View className="mx-4 py-8 items-center gap-1">
            <Text className="text-gray-400 text-sm">Aucun document dans cette catégorie</Text>
          </View>
        ) : (
          /* Documents list */
          <View
            className="mx-4 bg-white rounded-card overflow-hidden"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            {filteredDocs.map((doc, index) => (
              <View key={doc.id}>
                {index > 0 && (
                  <View className="h-px bg-gray-100 mx-4" />
                )}
                <DocumentRow
                  document={doc}
                  onPress={() => {
                    // TODO S3 : ouvrir / télécharger le document
                  }}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}
