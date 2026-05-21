import { createElement, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { openDocumentInBrowser } from '../components/PdfViewer';
import { API_BASE_URL, getToken } from '../services/api';
import { useAppTheme } from '../theme/useAppTheme';

function getAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function getViewerUrl(url: string, mimeType?: string): string {
  const absoluteUrl = getAbsoluteUrl(url);

  if (mimeType === 'application/pdf') {
    return `${API_BASE_URL}/pdfjs/web/viewer.html?file=${encodeURIComponent(absoluteUrl)}`;
  }

  return absoluteUrl;
}

function isImageDocument(mimeType?: string): boolean {
  return !!mimeType?.startsWith('image/');
}

function isOfficeDocument(mimeType?: string): boolean {
  return [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ].includes(mimeType ?? '');
}

function LoadingView({ colors }: { colors: ReturnType<typeof useAppTheme>['colors'] }) {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ marginTop: 12, color: colors.onSurfaceVariant, fontSize: 14 }}>
        Chargement du document...
      </Text>
    </View>
  );
}

function WebDocumentFrame({
  sourceUrl,
  title,
  colors,
}: {
  sourceUrl: string;
  title: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    async function loadDocument() {
      try {
        const headers: HeadersInit = {};
        const apiOrigin = new URL(API_BASE_URL).origin;
        const source = new URL(sourceUrl, API_BASE_URL);

        if (source.origin === apiOrigin && source.pathname.startsWith('/api/')) {
          const token = await getToken();
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
        }

        const response = await fetch(source.toString(), { headers });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (active) {
          setBlobUrl(objectUrl);
        }
      } catch {
        if (active) {
          setError('Impossible de charger ce document dans le lecteur interne.');
        }
      }
    }

    loadDocument();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [sourceUrl]);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background, gap: 12 }}>
        <FontAwesome name="file-o" size={34} color={colors.onSurfaceVariant} />
        <Text style={{ color: colors.onSurface, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>
          Aperçu impossible
        </Text>
        <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 20, textAlign: 'center' }}>
          {error}
        </Text>
      </View>
    );
  }

  if (!blobUrl) {
    return <LoadingView colors={colors} />;
  }

  return createElement('iframe', {
    src: blobUrl,
    title,
    style: {
      width: '100%',
      height: '100%',
      border: 0,
      backgroundColor: colors.background,
    },
  });
}

export default function DocumentViewerScreen() {
  const { colors } = useAppTheme();
  const [imageLoading, setImageLoading] = useState(true);
  const params = useLocalSearchParams<{
    url?: string;
    title?: string;
    mimeType?: string;
    controlsColor?: string;
  }>();

  const url = Array.isArray(params.url) ? params.url[0] : params.url;
  const title = (Array.isArray(params.title) ? params.title[0] : params.title) || 'Document';
  const mimeType = Array.isArray(params.mimeType) ? params.mimeType[0] : params.mimeType;
  const controlsColor = Array.isArray(params.controlsColor) ? params.controlsColor[0] : params.controlsColor;
  const viewerUrl = url ? getViewerUrl(url, mimeType) : null;
  const absoluteUrl = url ? getAbsoluteUrl(url) : null;

  if (!viewerUrl || !url) {
    return (
      <>
        <Stack.Screen options={{ title: 'Document' }} />
        <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
          <FontAwesome name="exclamation-circle" size={34} color={colors.error} />
          <Text style={{ color: colors.onSurface, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>
            Document indisponible
          </Text>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 20, textAlign: 'center' }}>
            L'adresse du document est manquante.
          </Text>
        </View>
      </>
    );
  }

  const sourceUrl = getAbsoluteUrl(url);

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => openDocumentInBrowser(sourceUrl, controlsColor || colors.primary)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir avec le système"
            >
              <FontAwesome name="external-link" size={18} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {isImageDocument(mimeType) ? (
          <ScrollView
            style={{ flex: 1, backgroundColor: '#000' }}
            contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
          >
            {imageLoading ? <LoadingView colors={colors} /> : null}
            <Image
              source={{ uri: sourceUrl }}
              resizeMode="contain"
              onLoadEnd={() => setImageLoading(false)}
              style={{ width: '100%', minHeight: '100%', backgroundColor: '#000' }}
              accessibilityLabel={title}
            />
          </ScrollView>
        ) : isOfficeDocument(mimeType) ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background, gap: 12 }}>
            <FontAwesome name="file-word-o" size={38} color={colors.onSurfaceVariant} />
            <Text style={{ color: colors.onSurface, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>
              Aperçu Office non disponible
            </Text>
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 20, textAlign: 'center' }}>
              Les fichiers Word et Excel demandent une conversion en PDF ou un viewer natif dédié pour être affichés proprement dans l'app.
            </Text>
            <TouchableOpacity
              onPress={() => openDocumentInBrowser(sourceUrl, controlsColor || colors.primary)}
              activeOpacity={0.78}
              style={{
                marginTop: 6,
                minHeight: 44,
                borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: colors.onPrimary, fontSize: 14, fontWeight: '700' }}>
                Ouvrir avec le système
              </Text>
            </TouchableOpacity>
          </View>
        ) : Platform.OS === 'web' ? (
          <WebDocumentFrame sourceUrl={sourceUrl} title={title} colors={colors} />
        ) : (
          <WebView
            source={{ uri: viewerUrl }}
            style={{ flex: 1, backgroundColor: colors.background }}
            originWhitelist={['*']}
            startInLoadingState
            renderLoading={() => <LoadingView colors={colors} />}
            renderError={() => (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                backgroundColor: colors.background,
                gap: 12,
              }}
            >
              <FontAwesome name="file-o" size={34} color={colors.onSurfaceVariant} />
              <Text style={{ color: colors.onSurface, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>
                Aperçu impossible
              </Text>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 20, textAlign: 'center' }}>
                Ce format ne peut pas être affiché directement ici.
              </Text>
              <TouchableOpacity
                onPress={() => openDocumentInBrowser(sourceUrl, controlsColor || colors.primary)}
                activeOpacity={0.78}
                style={{
                  marginTop: 6,
                  minHeight: 44,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ color: colors.onPrimary, fontSize: 14, fontWeight: '700' }}>
                  Ouvrir avec le système
                </Text>
              </TouchableOpacity>
            </View>
            )}
          />
        )}
      </View>
    </>
  );
}
