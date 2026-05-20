import { Alert, Platform, Share, Text, TouchableOpacity, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRef, useState } from 'react';
import { getAppColors, useAppTheme } from '../theme/useAppTheme';

type Props = {
  url: string;
  title?: string;
};

export function QRShare({ url, title = 'Lien public' }: Props) {
  const { colors } = useAppTheme();
  const qrColors = getAppColors('light');
  const qrRef = useRef<any>(null);
  const [sharingLink, setSharingLink] = useState(false);
  const [sharingQr, setSharingQr] = useState(false);

  async function copyLink() {
    if (Platform.OS === 'web' && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      Alert.alert('Lien copié', 'Le lien public est dans le presse-papiers.');
      return;
    }

    Alert.alert('Copier le lien', 'Maintiens le lien appuyé pour le sélectionner et le copier.');
  }

  async function shareLink() {
    if (sharingLink) return;
    setSharingLink(true);

    try {
      await Share.share({ title, message: url, url });
    } catch {
      Alert.alert('Partage indisponible', 'Impossible de partager ce lien pour le moment.');
    } finally {
      setSharingLink(false);
    }
  }

  async function shareQrCode() {
    if (sharingQr) return;
    setSharingQr(true);

    try {
      if (Platform.OS !== 'web' && await Sharing.isAvailableAsync() && qrRef.current?.toDataURL) {
        qrRef.current.toDataURL(async (data: string) => {
          try {
            const file = new File(Paths.cache, `doc2sail-qr-${Date.now()}.png`);
            file.create({ overwrite: true });
            file.write(data, { encoding: 'base64' });
            await Sharing.shareAsync(file.uri, {
              mimeType: 'image/png',
              dialogTitle: title,
              UTI: 'public.png',
            });
          } catch {
            await Share.share({ title, message: url, url });
          } finally {
            setSharingQr(false);
          }
        });
        return;
      }

      await Share.share({ title, message: url, url });
    } catch {
      Alert.alert('Partage indisponible', 'Impossible de partager ce QR code pour le moment.');
    } finally {
      if (Platform.OS === 'web' || !qrRef.current?.toDataURL) {
        setSharingQr(false);
      }
    }
  }

  return (
    <View
      style={{
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        padding: 16,
        gap: 14,
      }}
    >
      <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.onSurface }}>{title}</Text>
        <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>
          Donne accès à la vue publique de la régate.
        </Text>
      </View>

      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}>
        <View
          style={{
            padding: 14,
            borderRadius: 12,
            backgroundColor: qrColors.surface,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
          }}
        >
          <QRCode
            value={url}
            size={210}
            color={qrColors.primary}
            backgroundColor={qrColors.surface}
            logoBackgroundColor={qrColors.surface}
            quietZone={2}
            getRef={(ref: unknown) => { qrRef.current = ref; }}
          />
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase' }}>
          Lien public
        </Text>
        <View
          style={{
            minHeight: 54,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
            backgroundColor: colors.surfaceContainer,
            justifyContent: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text selectable style={{ color: colors.onSurface, fontSize: 13, lineHeight: 18 }}>
            {url}
          </Text>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <TouchableOpacity
          onPress={copyLink}
          activeOpacity={0.78}
          style={{
            minHeight: 50,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 16,
          }}
        >
          <FontAwesome name="copy" size={16} color={colors.onPrimary} />
          <Text style={{ color: colors.onPrimary, fontSize: 15, fontWeight: '800' }}>
            Copier le lien
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={shareLink}
            disabled={sharingLink}
            activeOpacity={0.78}
            style={{
              flex: 1,
              minHeight: 48,
              borderRadius: 12,
              backgroundColor: colors.primaryContainer,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              opacity: sharingLink ? 0.6 : 1,
              paddingHorizontal: 10,
            }}
          >
            <FontAwesome name="share-alt" size={15} color={colors.onPrimaryContainer} />
            <Text style={{ color: colors.onPrimaryContainer, fontSize: 13, fontWeight: '800' }} numberOfLines={1}>
              Partager
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={shareQrCode}
            disabled={sharingQr}
            activeOpacity={0.78}
            style={{
              flex: 1,
              minHeight: 48,
              borderRadius: 12,
              backgroundColor: colors.secondaryContainer,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              opacity: sharingQr ? 0.6 : 1,
              paddingHorizontal: 10,
            }}
          >
            <FontAwesome name="qrcode" size={15} color={colors.onSecondaryContainer} />
            <Text style={{ color: colors.onSecondaryContainer, fontSize: 13, fontWeight: '800' }} numberOfLines={1}>
              QR code
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
