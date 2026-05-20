import { ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { CenteredLoader } from '../../../components/ui/CircularLoadingIndicator';
import { QRShare } from '../../../components/QRShare';
import { useRegattaDetail } from '../../../hooks/useRegattaDetail';
import { getPublicRegattaUrl } from '../../../services/publicRegattas';
import { useAppTheme } from '../../../theme/useAppTheme';

export default function ShareRegattaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { regatta, loading, error } = useRegattaDetail(id);
  const { colors } = useAppTheme();

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Partager' }} />
        <CenteredLoader size={48} />
      </>
    );
  }

  if (error || !regatta?.accessToken) {
    return (
      <>
        <Stack.Screen options={{ title: 'Partager' }} />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 28, gap: 12 }}>
          <FontAwesome name="exclamation-circle" size={34} color={colors.error} />
          <Text style={{ color: colors.onSurface, fontSize: 18, fontWeight: '700' }}>
            Partage indisponible
          </Text>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 20 }}>
            {error || 'Cette régate ne possède pas encore de lien public.'}
          </Text>
        </View>
      </>
    );
  }

  const publicUrl = getPublicRegattaUrl(regatta.accessToken);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Partager',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 20, gap: 18 }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
            padding: 16,
            gap: 8,
          }}
        >
          <Text style={{ color: colors.onSurface, fontSize: 20, fontWeight: '800' }}>
            {regatta.name}
          </Text>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 20 }}>
            Partage la vue publique avec un équipage, un comité ou des participants. Aucune connexion n'est requise.
          </Text>
        </View>

        <QRShare url={publicUrl} title="Partager la régate" />
      </ScrollView>
    </>
  );
}
