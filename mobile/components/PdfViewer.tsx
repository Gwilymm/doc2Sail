import { Alert, Platform, Text, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAppTheme } from '../theme/useAppTheme';

type Props = {
  title: string;
  url: string;
  mimeType?: string;
};

type OpenDocumentOptions = {
  title?: string;
  mimeType?: string;
  controlsColor?: string;
};

export async function openDocumentUrl(url: string, options: OpenDocumentOptions = {}): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    router.push({
      pathname: '/document-viewer',
      params: {
        url,
        title: options.title ?? 'Document',
        mimeType: options.mimeType ?? '',
        controlsColor: options.controlsColor ?? '',
      },
    });
  } catch {
    Alert.alert('Document indisponible', 'Impossible d\'ouvrir ce document pour le moment.');
  }
}

export async function openDocumentInBrowser(url: string, controlsColor?: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      controlsColor,
    });
  } catch {
    Alert.alert('Document indisponible', 'Impossible d\'ouvrir ce document pour le moment.');
  }
}

export function PdfViewer({ title, url, mimeType }: Props) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      onPress={() => openDocumentUrl(url, { title, mimeType, controlsColor: colors.primary })}
      activeOpacity={0.78}
      style={{
        minHeight: 52,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
      }}
    >
      <FontAwesome name="file-pdf-o" size={18} color={colors.onPrimary} />
      <Text style={{ color: colors.onPrimary, fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
