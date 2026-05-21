import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { extractPublicRegattaToken, joinPublicRegatta } from '../../services/publicRegattas';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../theme/useAppTheme';

type WebScannerProps = {
  active: boolean;
  onScanned: (data: string) => void;
  onError: (message: string) => void;
};

function WebQrScanner({ active, onScanned, onError }: WebScannerProps) {
  const videoRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const loopRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!active) return;
      if (!navigator?.mediaDevices?.getUserMedia) {
        onError('La camera n\'est pas disponible dans ce navigateur.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        await video.play();

        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const scan = async () => {
            if (!active || cancelled) return;
            if (video.readyState < 2) {
              loopRef.current = requestAnimationFrame(scan);
              return;
            }

            try {
              const codes = await detector.detect(video);
              const value = codes?.[0]?.rawValue;
              if (value) {
                onScanned(value);
                return;
              }
            } catch {
              // ignore transient detection errors
            }

            loopRef.current = requestAnimationFrame(scan);
          };

          scan();
          return;
        }

        const { BrowserQRCodeReader } = await import('@zxing/browser');
        const reader = new BrowserQRCodeReader();
        const controls = await reader.decodeFromVideoDevice(null, video, (result, error, controls) => {
          if (result) {
            onScanned(result.getText());
            controls.stop();
          }
          if (error && error.name === 'NotAllowedError') {
            onError('Autorisation camera refusee.');
          }
        });
        zxingControlsRef.current = controls;
      } catch (err: any) {
        if (err?.name === 'NotAllowedError') {
          onError('Autorisation camera refusee.');
        } else {
          onError('Impossible d\'acceder a la camera.');
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
      if (zxingControlsRef.current) zxingControlsRef.current.stop();
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, [active, onError, onScanned]);

  const WebVideo: any = 'video';

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <WebVideo
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        muted
        playsInline
      />
    </View>
  );
}

export default function ScanRegattaScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { checkAuth } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [joining, setJoining] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';
  const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : true;
  const canUseWebCamera = !isWeb || isSecureContext;
  const scannerActive = !scanned && !joining;

  async function handleJoinToken(token: string) {
    await handleJoinToken(token);
  }

  async function handleScannedData(data: string) {
    if (scanned) return;

    const token = extractPublicRegattaToken(data);
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
        {isWeb ? (
          canUseWebCamera ? (
            <View style={{ flex: 1 }}>
              <WebQrScanner
                active={scannerActive}
                onScanned={handleScannedData}
                onError={(message) => setWebError(message)}
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
                {webError ? (
                  <Text style={{ color: colors.error, fontSize: 12, textAlign: 'center' }}>
                    {webError}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', padding: 28, gap: 14 }}>
              <FontAwesome name="camera" size={36} color={colors.primary} />
              <Text style={{ color: colors.onSurface, fontSize: 20, fontWeight: '800' }}>
                Caméra indisponible
              </Text>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 20 }}>
                Sur le web, l\'accès caméra nécessite une page en HTTPS.
              </Text>
            </View>
          )
        ) : hasPermission && canUseWebCamera ? (
          <View style={{ flex: 1 }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              active={scannerActive}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scannerActive ? (event) => handleScannedData(event.data) : undefined}
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
