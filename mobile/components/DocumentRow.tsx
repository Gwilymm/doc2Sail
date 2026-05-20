import { TouchableOpacity, View, Text } from 'react-native';
import { Document } from '../hooks/useRegattaDetail';
import { getDocCategoryColor, useAppTheme } from '../theme/useAppTheme';

// --- Helpers ---

function getFileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'text/csv'
  )
    return '📊';
  return '📝';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatUploadDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

// --- Component ---

type Props = {
  document: Document;
  onPress?: () => void;
};

export function DocumentRow({ document, onPress }: Props) {
  const { isDark, colors } = useAppTheme();
  const icon = getFileIcon(document.mimeType);
  const size = formatSize(document.size);
  const uploadedAt = formatUploadDate(document.uploadedAt);
  const catColor = getDocCategoryColor(document.category, isDark);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.surface,
      }}
    >
      {/* File icon */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colors.iconBg,
          borderWidth: 1,
          borderColor: colors.iconBorder,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          flexShrink: 0,
        }}
      >
        <Text style={{ fontSize: 20, lineHeight: 24 }}>{icon}</Text>
      </View>

      {/* Name + meta */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{ fontSize: 14, fontWeight: '600', color: colors.onSurface, lineHeight: 20 }}
          numberOfLines={2}
        >
          {document.name}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: catColor.bg }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: catColor.text }}>
              {document.category}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>{size}</Text>
          {uploadedAt ? (
            <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>{uploadedAt}</Text>
          ) : null}
        </View>
      </View>

      {/* Chevron */}
      <Text style={{ fontSize: 20, color: colors.chevron, marginLeft: 8 }}>›</Text>
    </TouchableOpacity>
  );
}
