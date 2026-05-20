import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAppTheme } from '../../../theme/useAppTheme';
import {
  DOCUMENT_CATEGORIES,
  MAX_DOCUMENT_SIZE,
  isAllowedDocumentType,
  uploadDocument,
} from '../../../services/documents';

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  webFile?: unknown;
  size?: number | null;
};

function formatSize(bytes?: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function UploadDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(DOCUMENT_CATEGORIES[0]);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => !!file && title.trim().length > 0 && !submitting, [file, title, submitting]);

  async function pickFile() {
    setError('');
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'application/octet-stream';
    if (!isAllowedDocumentType(mimeType)) {
      setError('Format de fichier non autorisé.');
      return;
    }
    if (asset.size && asset.size > MAX_DOCUMENT_SIZE) {
      setError('Le fichier dépasse la limite de 100 Mo.');
      return;
    }

    setFile({
      uri: asset.uri,
      name: asset.name,
      mimeType,
      webFile: (asset as { file?: unknown }).file,
      size: asset.size,
    });
    setTitle((current) => current || asset.name.replace(/\.[^/.]+$/, ''));
  }

  async function submit() {
    if (!file || !id || submitting) return;
    if (!title.trim()) {
      setError('Le nom du document est obligatoire.');
      return;
    }

    setSubmitting(true);
    setError('');
    setProgress(0);

    try {
      await uploadDocument({
        regattaId: id,
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
        webFile: file.webFile,
        size: file.size,
        title: title.trim(),
        category,
        description,
        onProgress: setProgress,
      });
      router.back();
    } catch (e: any) {
      const message = e?.message ?? 'Upload impossible';
      setError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Upload impossible', message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Ajouter un fichier',
          presentation: 'modal',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
        }}
      />
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, gap: 18 }}>
        <TouchableOpacity
          onPress={pickFile}
          activeOpacity={0.78}
          disabled={submitting}
          style={{
            minHeight: 136,
            borderRadius: 12,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.outline,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            gap: 10,
          }}
        >
          <FontAwesome name={file ? 'file-text-o' : 'upload'} size={28} color={colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.onSurface, textAlign: 'center' }}>
            {file ? file.name : 'Choisir un document'}
          </Text>
          {file?.size ? (
            <Text style={{ fontSize: 13, color: colors.onSurfaceVariant }}>{formatSize(file.size)}</Text>
          ) : (
            <Text style={{ fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center' }}>
              PDF, Word, Excel, image ou texte. Maximum 100 Mo.
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.onSurfaceVariant }}>Nom du document</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            editable={!submitting}
            placeholder="Avis de course"
            placeholderTextColor={colors.onSurfaceVariant}
            style={{
              minHeight: 52,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.outline,
              backgroundColor: colors.inputBg,
              color: colors.onSurface,
              paddingHorizontal: 14,
              fontSize: 16,
            }}
          />
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.onSurfaceVariant }}>Catégorie</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DOCUMENT_CATEGORIES.map((item) => {
              const selected = item === category;
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => setCategory(item)}
                  disabled={submitting}
                  activeOpacity={0.75}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.outline,
                    backgroundColor: selected ? colors.primary : colors.surface,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? colors.onPrimary : colors.onSurface }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.onSurfaceVariant }}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            editable={!submitting}
            placeholder="Note interne optionnelle"
            placeholderTextColor={colors.onSurfaceVariant}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 92,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.outline,
              backgroundColor: colors.inputBg,
              color: colors.onSurface,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
            }}
          />
        </View>

        {submitting ? (
          <View style={{ gap: 8 }}>
            <View style={{ height: 8, borderRadius: 999, backgroundColor: colors.surfaceContainerHigh, overflow: 'hidden' }}>
              <View style={{ width: `${Math.max(0.04, progress) * 100}%`, height: 8, backgroundColor: colors.primary }} />
            </View>
            <Text style={{ fontSize: 13, color: colors.onSurfaceVariant }}>{Math.round(progress * 100)} %</Text>
          </View>
        ) : null}

        {error ? (
          <Text style={{ fontSize: 14, color: colors.danger }}>{error}</Text>
        ) : null}

        <TouchableOpacity
          onPress={submit}
          disabled={!canSubmit}
          activeOpacity={0.82}
          style={{
            height: 52,
            borderRadius: 12,
            backgroundColor: canSubmit ? colors.primary : colors.surfaceContainerHigh,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 4,
            opacity: canSubmit ? 1 : 0.72,
          }}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: '700', color: canSubmit ? colors.onPrimary : colors.onSurfaceVariant }}>
              Envoyer
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}
