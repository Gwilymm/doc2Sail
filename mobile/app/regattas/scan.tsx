import { useState } from 'react';
import { Alert, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { extractPublicRegattaToken, joinPublicRegatta } from '../../services/publicRegattas';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../theme/useAppTheme';

export default function ScanRegattaScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { checkAuth } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [joining, setJoining] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';
  const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : true;
  const canUseWebCamera = !isWeb || isSecureContext;

  async function handleJoinToken(token: string) {
    setManualError(null);
    setScanned(true);
    setJoining(true);

    try {
      const joined = await joinPublicRegatta(token);
      await checkAuth();
      router.replace(`/(tabs)/regattas/${joined.id}`);
    } catch (e: any) {
      setJoining(false);
      setScanned(false);
      Alert.alert(
        'Ajout impossible',
        e?.message ?? 'Impossible d\'ajouter cette régate aux régates partagées.',
        [
          { text: 'Voir public', onPress: () => router.replace(`/public/${encodeURIComponent(token)}`) },
          { text: 'Réessayer', onPress: () => { setJoining(false); setScanned(false); } },
        ]
      );
    }
  }

  async function handleScanned(result: BarcodeScanningResult) {
    if (scanned) return;

    const token = extractPublicRegattaToken(result.data);
    if (!token) {
      setScanned(true);
      Alert.alert(
        'QR code non reconnu',
        'Ce QR code ne contient pas un lien public Doc2Sail.',
        [{ text: 'Réessayer', onPress: () => setScanned(false) }]
      );
      return;
    }

    setScanned(true);
    setJoining(true);

    try {
      const joined = await joinPublicRegatta(token);
      await checkAuth();
      router.replace(`/(tabs)/regattas/${joined.id}`);
    } catch (e: any) {
      setJoining(false);
      setScanned(false);
      Alert.alert(
        'Ajout impossible',
        e?.message ?? 'Impossible d\'ajouter cette régate aux régates partagées.',
        [
          { text: 'Voir public', onPress: () => router.replace(`/public/${encodeURIComponent(token)}`) },
          { text: 'Réessayer', onPress: () => { setJoining(false); setScanned(false); } },
        ]
      );
    }
  }

  const hasPermission = permission?.granted;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Scanner',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {hasPermission && canUseWebCamera ? (
          <View style={{ flex: 1 }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              active={!scanned && !joining}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned || joining ? undefined : handleScanned}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 28,
                right: 28,
                top: '26%',
                aspectRatio: 1,
                borderRadius: 18,
                borderWidth: 3,
                borderColor: colors.primary,
                backgroundColor: 'transparent',
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: 20,
                right: 20,
                bottom: 28,
                borderRadius: 12,
                backgroundColor: colors.surface,
                padding: 16,
                gap: 6,
              }}
            >
              <Text style={{ color: colors.onSurface, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
                {joining ? 'Ajout de la régate...' : 'Vise le QR code de la régate'}
              </Text>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, lineHeight: 18, textAlign: 'center' }}>
                {joining
                  ? 'Elle apparaîtra ensuite dans vos régates partagées.'
                  : 'Elle sera ajoutée à vos régates partagées puis ouverte dans l\'app.'}
              </Text>
              {!joining && (
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, textAlign: 'center', marginTop: 6 }}>
                  Si rien ne se passe, colle le lien ou le token du QR code ci-dessous.
                </Text>
              )}
            </View>
            <View style={{ paddingHorizontal: 20, paddingBottom: 20, marginTop: 10 }}>
              <TextInput
                value={manualInput}
                onChangeText={(text) => {
                  setManualInput(text);
                  setManualError(null);
                }}
                placeholder="Coller le lien QR ou le token"
                placeholderTextColor={colors.onSurfaceVariant}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!joining}
                style={{
                  height: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.outlineVariant,
                  paddingHorizontal: 14,
                  color: colors.onSurface,
                  backgroundColor: colors.surface,
                }}
              />
              {manualError ? (
                <Text style={{ color: '#b00020', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
                  {manualError}
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={async () => {
                  const token = extractPublicRegattaToken(manualInput.trim());
                  if (!token) {
                    setManualError('Lien ou token non reconnu.');
                    return;
                  }
                  await handleJoinToken(token);
                }}
                disabled={joining || manualInput.trim().length === 0}
                activeOpacity={0.8}
                style={{
                  height: 50,
                  borderRadius: 12,
                  backgroundColor: joining || manualInput.trim().length === 0 ? colors.outline : colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 12,
                }}
              >
                <Text style={{ color: colors.onPrimary, fontSize: 15, fontWeight: '700' }}>
                  Coller le lien QR
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', padding: 28, gap: 14 }}>
            <FontAwesome name="camera" size={36} color={colors.primary} />
            <Text style={{ color: colors.onSurface, fontSize: 20, fontWeight: '800' }}>
              {canUseWebCamera ? 'Autoriser la caméra' : 'Caméra indisponible'}
            </Text>
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 20 }}>
              {canUseWebCamera
                ? 'Doc2Sail utilise la caméra uniquement pour lire les QR codes de partage des régates.'
                : 'Sur le web, l\'accès caméra nécessite une page en HTTPS. Ouvre cette page en HTTPS ou utilise l\'app mobile.'}
            </Text>
            {canUseWebCamera && (
              <TouchableOpacity
                onPress={requestPermission}
                disabled={isWeb && permission?.canAskAgain === false}
                activeOpacity={0.8}
                style={{
                  height: 52,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 4,
                }}
              >
                <Text style={{ color: colors.onPrimary, fontSize: 15, fontWeight: '700' }}>
                  Autoriser
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </>
  );
}
