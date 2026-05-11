import { TouchableOpacity, View, Text } from 'react-native';
import { Document } from '../hooks/useRegattaDetail';
import { useTheme } from '../context/ThemeContext';

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

type CategoryColor = { bg: string; text: string };

const CATEGORY_COLORS: Record<'light' | 'dark', Record<string, CategoryColor>> = {
  light: {
    AC:                  { bg: '#C7EAF3', text: '#003543' },
    IC:                  { bg: '#E0E7FF', text: '#253060' },
    Modifications:       { bg: '#FFE3A6', text: '#5A3B00' },
    'Gestion de course': { bg: '#DDF7ED', text: '#0F5138' },
    Jury:                { bg: '#FFDAD6', text: '#690005' },
    Résultats:           { bg: '#E9F8D8', text: '#365314' },
  },
  dark: {
    AC:                  { bg: '#003543', text: '#C7EAF3' },
    IC:                  { bg: '#1E2563', text: '#C5D0FF' },
    Modifications:       { bg: '#4A3000', text: '#FFD285' },
    'Gestion de course': { bg: '#0A3525', text: '#8EEEC4' },
    Jury:                { bg: '#4D0008', text: '#FFB4AB' },
    Résultats:           { bg: '#253800', text: '#C5E88A' },
  },
};

function getCategoryColor(category: string, isDark: boolean): CategoryColor {
  const palette = CATEGORY_COLORS[isDark ? 'dark' : 'light'];
  return palette[category] ?? (isDark
    ? { bg: '#1F2937', text: '#9CA3AF' }
    : { bg: '#F3F4F6', text: '#4B5563' }
  );
}

// --- Component ---

type Props = {
  document: Document;
  onPress?: () => void;
};

export function DocumentRow({ document, onPress }: Props) {
  const { isDark } = useTheme();
  const icon = getFileIcon(document.mimeType);
  const size = formatSize(document.size);
  const uploadedAt = formatUploadDate(document.uploadedAt);
  const catColor = getCategoryColor(document.category, isDark);

  const colors = isDark ? {
    surface:          '#082437',
    onSurface:        '#EAF7FA',
    onSurfaceVariant: '#78919A',
    iconBg:           '#143449',
    iconBorder:       '#31515D',
    chevron:          '#31515D',
  } : {
    surface:          '#FFFFFF',
    onSurface:        '#071D2B',
    onSurfaceVariant: '#4A6572',
    iconBg:           '#F9FAFB',
    iconBorder:       '#F3F4F6',
    chevron:          '#D3E0E4',
  };

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
