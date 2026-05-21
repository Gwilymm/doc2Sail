import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAppTheme } from '../../theme/useAppTheme';
import { DocumentRow } from '../../components/DocumentRow';
import { openDocumentUrl } from '../../components/PdfViewer';
import { QRShare } from '../../components/QRShare';
import { CenteredLoader } from '../../components/ui/CircularLoadingIndicator';
import { fetchPublicRegatta, joinPublicRegatta, PublicRegatta } from '../../services/publicRegattas';
import { useAuth } from '../../context/AuthContext';

function formatDateRange(startIso?: string | null, endIso?: string | null): string {
  if (!startIso || !endIso) return '';

  const start = new Date(startIso);
  const end = new Date(endIso);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString('fr-FR', { month: 'long' });
  const endMonth = end.toLocaleDateString('fr-FR', { month: 'long' });
  const year = end.getFullYear();

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay} - ${endDay} ${endMonth} ${year}`;
  }

  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
}

export default function PublicRegattaScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [regatta, setRegatta] = useState<PublicRegatta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const data = await fetchPublicRegatta(token);
      setRegatta(data);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur réseau');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const handleJoin = useCallback(async () => {
    if (!token) return;
    setJoinError('');
    setJoining(true);

    try {
      const joined = await joinPublicRegatta(token);
      await router.replace(`/(tabs)/regattas/${joined.id}`);
    } catch (e: any) {
      setJoinError(e?.message ?? 'Impossible d\'ajouter cette régate à vos régates.');
    } finally {
      setJoining(false);
    }
  }, [router, token]);

  useEffect(() => {
    load();
  }, [load]);

  const documentsByCategory = useMemo(() => {
    const grouped = new Map<string, PublicRegatta['documents']>();
    regatta?.documents.forEach((document) => {
      const current = grouped.get(document.category) ?? [];
      current.push(document);
      grouped.set(document.category, current);
    });
    return Array.from(grouped.entries());
  }, [regatta]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Vue publique' }} />
        <CenteredLoader size={48} />
      </>
    );
  }

  if (error || !regatta) {
    return (
      <>
        <Stack.Screen options={{ title: 'Vue publique' }} />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 28, gap: 12 }}>
          <FontAwesome name="exclamation-circle" size={34} color={colors.error} />
          <Text style={{ color: colors.onSurface, fontSize: 18, fontWeight: '700' }}>
            Régate indisponible
          </Text>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 20 }}>
            {error || 'Cette régate n\'est plus accessible publiquement.'}
          </Text>
        </View>
      </>
    );
  }

  const dateRange = formatDateRange(regatta.startDate, regatta.endDate);

  return (
    <>
      <Stack.Screen options={{ title: regatta.name }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={{ backgroundColor: colors.surface, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.surfaceContainerHigh,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 22 }}>⛵</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.onSurface, fontSize: 21, fontWeight: '800', lineHeight: 27 }}>
                {regatta.name}
              </Text>
              {dateRange ? (
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                  {dateRange}
                </Text>
              ) : null}
            </View>
          </View>

          {regatta.description ? (
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 20 }}>
              {regatta.description}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <FontAwesome name="unlock" size={13} color={colors.onSurfaceVariant} />
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
              Accès public sans connexion
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 16 }}>
          <QRShare url={regatta.publicUrl} title="Partager la régate" />

          {authLoading ? (
            <View style={{ padding: 14, borderRadius: 14, backgroundColor: colors.surface }}>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>Vérification de connexion…</Text>
            </View>
          ) : isAuthenticated ? (
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={handleJoin}
                disabled={joining}
                activeOpacity={0.8}
                style={{
                  height: 50,
                  borderRadius: 14,
                  backgroundColor: joining ? colors.outline : colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.onPrimary, fontSize: 15, fontWeight: '700' }}>
                  {joining ? 'Ajout en cours…' : 'Ajouter cette régate à mes régates'}
                </Text>
              </TouchableOpacity>
              {joinError ? (
                <Text style={{ color: '#ba1a1a', fontSize: 13, textAlign: 'center' }}>
                  {joinError}
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 14, gap: 8 }}>
              <Text style={{ color: colors.onSurface, fontSize: 14, fontWeight: '700' }}>
                Connecte-toi pour ajouter cette régate à ton espace.
              </Text>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, lineHeight: 18 }}>
                Si tu ouvres ce lien depuis le lecteur QR de ton téléphone, connecte-toi puis clique sur le bouton d'ajout.
              </Text>
            </View>
          )}

          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: colors.onSurfaceVariant,
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {regatta.documents.length} document{regatta.documents.length !== 1 ? 's' : ''}
            </Text>

            {regatta.documents.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingVertical: 36,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <FontAwesome name="folder-open-o" size={30} color={colors.onSurfaceVariant} />
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, textAlign: 'center' }}>
                  Aucun document publié pour cette régate.
                </Text>
              </View>
            ) : (
              documentsByCategory.map(([category, documents]) => (
                <View key={category} style={{ gap: 8 }}>
                  <Text style={{ color: colors.onSurface, fontSize: 15, fontWeight: '700' }}>
                    {category}
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      overflow: 'hidden',
                      borderWidth: isDark ? 1 : 0,
                      borderColor: colors.outlineVariant,
                    }}
                  >
                    {documents.map((document, index) => (
                      <View key={document.id}>
                        {index > 0 ? (
                          <View style={{ height: 1, marginHorizontal: 16, backgroundColor: colors.divider }} />
                        ) : null}
                        <DocumentRow
                          document={document}
                          onPress={() => {
                            if (document.fileExists === false) {
                              Alert.alert(
                                'Fichier manquant',
                                'La fiche existe encore, mais le fichier physique est absent du serveur.'
                              );
                              return;
                            }

                            openDocumentUrl(document.fileUrl, {
                              title: document.name,
                              mimeType: document.mimeType,
                              controlsColor: colors.primary,
                            });
                          }}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
