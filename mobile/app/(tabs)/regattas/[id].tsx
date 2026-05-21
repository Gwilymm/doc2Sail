import { Alert, Platform, ScrollView, View, Text, RefreshControl, TouchableOpacity, TextInput, Pressable } from 'react-native';
import { useFocusEffect, useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useState, useMemo, useRef, useCallback } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRegattaDetail, type Document as RegattaDocument } from '../../../hooks/useRegattaDetail';
import { DocumentRow } from '../../../components/DocumentRow';
import { FilterBottomSheet, SortKey } from '../../../components/FilterBottomSheet';
import { CenteredLoader } from '../../../components/ui/CircularLoadingIndicator';
import { useAppTheme } from '../../../theme/useAppTheme';
import { openDocumentUrl } from '../../../components/PdfViewer';
import { getPublicDocumentFileUrl } from '../../../services/publicRegattas';
import { apiFetch } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- Date helpers ---

function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString('fr-FR', { month: 'long' });
  const endMonth = end.toLocaleDateString('fr-FR', { month: 'long' });
  const year = end.getFullYear();

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay} – ${endDay} ${endMonth} ${year}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
}

// --- Screen ---

export default function RegattaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { regatta, documents, loading, refreshing, error, refresh } = useRegattaDetail(id);
  const { user } = useAuth();
  const { isDark, colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [activeSort, setActiveSort] = useState<SortKey>('recent');
  const [search, setSearch] = useState('');
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);
  const searchRef = useRef<TextInput>(null);
  const didFocusOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (didFocusOnce.current) {
        refresh();
      } else {
        didFocusOnce.current = true;
      }
    }, [refresh])
  );

  const categories = useMemo(() => {
    const seen = new Set<string>();
    documents.forEach((d) => seen.add(d.category));
    return Array.from(seen);
  }, [documents]);

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = documents.filter((d) => {
      if (activeCategories.length > 0 && !activeCategories.includes(d.category)) return false;
      if (q && !d.name.toLowerCase().includes(q)) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (activeSort === 'name') return a.name.localeCompare(b.name, 'fr');
      const dateA = new Date(a.uploadedAt).getTime();
      const dateB = new Date(b.uploadedAt).getTime();
      return activeSort === 'recent' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [documents, activeCategories, activeSort, search]);

  const hasActiveFilter = activeCategories.length > 0;
  const canManage = useMemo(() => {
    if (!regatta || !user) return false;

    return regatta.owner.id === user.id || (regatta.coOwners ?? []).some((coOwner) => coOwner.id === user.id);
  }, [regatta, user]);

  const showMessage = useCallback((title: string, message: string) => {
    if (Platform.OS === 'web') {
      globalThis.alert?.(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  }, []);

  const confirmDeleteDocument = useCallback((documentName: string): Promise<boolean> => {
    const message = `Supprimer "${documentName}" ?\n\nCette action supprimera aussi le fichier du serveur.`;

    if (Platform.OS === 'web') {
      return Promise.resolve(globalThis.confirm?.(message) ?? false);
    }

    return new Promise((resolve) => {
      Alert.alert(
        'Supprimer le document ?',
        'Cette action supprimera aussi le fichier du serveur.',
        [
          { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Supprimer', style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });
  }, []);

  const handleOpenDocument = useCallback((doc: RegattaDocument) => {
    if (doc.fileExists === false) {
      showMessage(
        'Fichier manquant',
        'La fiche existe encore en base, mais le fichier physique est absent du serveur. Vous pouvez supprimer cette ligne si vous gérez la régate.'
      );
      return;
    }

    const url = regatta?.accessToken
      ? getPublicDocumentFileUrl(regatta.accessToken, doc.id)
      : doc.fileUrl ?? doc.downloadUrl;

    if (url) {
      openDocumentUrl(url, { title: doc.name, mimeType: doc.mimeType, controlsColor: colors.primary });
    }
  }, [colors.primary, regatta?.accessToken, showMessage]);

  const handleDeleteDocument = useCallback(async (doc: RegattaDocument) => {
    const confirmed = await confirmDeleteDocument(doc.name);
    if (!confirmed) return;

    setDeletingDocumentId(doc.id);

    try {
      const response = await apiFetch(`/api/documents/${doc.id}/delete`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Impossible de supprimer ce document.');
      }

      await refresh();
    } catch (deleteError: any) {
      showMessage('Suppression impossible', deleteError?.message ?? 'Une erreur est survenue.');
    } finally {
      setDeletingDocumentId(null);
    }
  }, [confirmDeleteDocument, refresh, showMessage]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Chargement…' }} />
        <CenteredLoader size={48} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Erreur' }} />
        <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 }}>
          <Text style={{ fontSize: 36 }}>⚠️</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.onSurface, textAlign: 'center' }}>
            Impossible de charger la régate
          </Text>
          <Text style={{ fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center' }}>{error}</Text>
        </View>
      </>
    );
  }

  if (!regatta) return null;

  const dateRange = formatDateRange(regatta.startDate, regatta.endDate);

  return (
    <>
      <Stack.Screen
        options={{
          title: regatta.name,
          headerLeft: Platform.OS === 'web'
            ? () => (
              <TouchableOpacity
                onPress={() => router.replace('/(tabs)/regattas')}
                accessibilityRole="button"
                accessibilityLabel="Retour aux régates"
                hitSlop={12}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                <FontAwesome name="chevron-left" size={18} color={colors.primary} />
              </TouchableOpacity>
            )
            : undefined,
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 76 + insets.bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header card */}
        <View
          style={{
            backgroundColor: colors.surface,
            paddingHorizontal: 20,
            paddingVertical: 20,
            gap: 12,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0 : 0.06,
            shadowRadius: 6,
            elevation: isDark ? 0 : 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.surfaceContainerHigh,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <Text style={{ fontSize: 22, lineHeight: 26 }}>⛵</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.onSurface, lineHeight: 26 }}>
                {regatta.name}
              </Text>
              <Text style={{ fontSize: 14, color: colors.primary, marginTop: 2 }}>{dateRange}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>Organisé par</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.onSurface }}>
              {regatta.owner.displayName ?? `Utilisateur #${regatta.owner.id}`}
            </Text>
          </View>

          {regatta.description ? (
            <Text style={{ fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 20 }}>
              {regatta.description}
            </Text>
          ) : null}
        </View>

        {/* M3 Search bar */}
        {documents.length > 0 && (
          <Pressable
            onPress={() => searchRef.current?.focus()}
            style={{
              marginTop: 16,
              marginHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.searchBg,
              paddingLeft: 16,
              paddingRight: 12,
              gap: 16,
            }}
          >
            <FontAwesome name="search" size={24} color={colors.searchIcon} />
            <TextInput
              ref={searchRef}
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un document…"
              placeholderTextColor={colors.searchIcon}
              returnKeyType="search"
              style={{
                flex: 1,
                fontSize: 16,
                letterSpacing: 0.5,
                color: colors.searchText,
                paddingVertical: 0,
              }}
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => { setSearch(''); searchRef.current?.focus(); }}
                hitSlop={8}
                activeOpacity={0.7}
                style={{ padding: 4 }}
              >
                <FontAwesome name="times-circle" size={20} color={colors.searchIcon} />
              </TouchableOpacity>
            )}
          </Pressable>
        )}

        {/* Documents header row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 20,
            paddingHorizontal: 16,
            marginBottom: 8,
          }}
        >
          {/* Count + active filter chips */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                letterSpacing: 0.5,
                color: colors.onSurfaceVariant,
                textTransform: 'uppercase',
              }}
            >
              {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
            </Text>

            {activeCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategories((prev) => prev.filter((c) => c !== cat))}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  height: 24,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                  backgroundColor: colors.chipBg,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.chipText }}>{cat}</Text>
                <Text style={{ fontSize: 12, color: colors.chipText }}>×</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Filter button */}
          {documents.length > 0 && (
            <TouchableOpacity
              onPress={() => setSheetVisible(true)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                height: 32,
                paddingHorizontal: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: hasActiveFilter ? colors.filterActiveBorder : colors.outlineVariant,
                backgroundColor: hasActiveFilter ? colors.filterActive : 'transparent',
              }}
            >
              <Text style={{ fontSize: 16, lineHeight: 20 }}>⚙</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  letterSpacing: 0.1,
                  color: hasActiveFilter ? colors.filterActiveText : colors.onSurfaceVariant,
                }}
              >
                Filtrer
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Documents list */}
        {documents.length === 0 ? (
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: colors.surface,
              borderRadius: 12,
              paddingVertical: 40,
              alignItems: 'center',
              gap: 8,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0 : 0.04,
              shadowRadius: 4,
              elevation: isDark ? 0 : 1,
            }}
          >
            <Text style={{ fontSize: 32 }}>📂</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.onSurfaceVariant }}>Aucun document</Text>
            <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 32 }}>
              Les documents partagés pour cette régate apparaîtront ici.
            </Text>
          </View>
        ) : filteredDocs.length === 0 ? (
          <View style={{ marginHorizontal: 16, paddingVertical: 32, alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 14, color: colors.onSurfaceVariant }}>Aucun document dans cette catégorie</Text>
          </View>
        ) : (
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: colors.surface,
              borderRadius: 12,
              overflow: 'hidden',
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0 : 0.06,
              shadowRadius: 6,
              elevation: isDark ? 0 : 2,
            }}
          >
            {filteredDocs.map((doc, index) => (
              <View key={doc.id}>
                {index > 0 && (
                  <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: 16 }} />
                )}
                <DocumentRow
                  document={doc}
                  onPress={() => handleOpenDocument(doc)}
                  onDelete={canManage ? () => handleDeleteDocument(doc) : undefined}
                  deleting={deletingDocumentId === doc.id}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Filter bottom sheet */}
      <FilterBottomSheet
        visible={sheetVisible}
        categories={categories}
        activeCategories={activeCategories}
        activeSort={activeSort}
        onApply={(cats, sort) => {
          setActiveCategories(cats);
          setActiveSort(sort);
        }}
        onClose={() => setSheetVisible(false)}
      />
    </>
  );
}
