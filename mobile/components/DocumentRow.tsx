import { TouchableOpacity, View, Text } from 'react-native';
import { Document } from '../hooks/useRegattaDetail';

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

type CategoryStyle = { bg: string; text: string };

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  AC:                 { bg: 'bg-sky-100',     text: 'text-sky-700' },
  IC:                 { bg: 'bg-indigo-100',  text: 'text-indigo-700' },
  Modifications:      { bg: 'bg-amber-100',   text: 'text-amber-700' },
  'Gestion de course':{ bg: 'bg-emerald-100', text: 'text-emerald-700' },
  Jury:               { bg: 'bg-red-100',     text: 'text-red-700' },
  Résultats:          { bg: 'bg-purple-100',  text: 'text-purple-700' },
};

function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_STYLES[category] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
}

// --- Component ---

type Props = {
  document: Document;
  onPress?: () => void;
};

export function DocumentRow({ document, onPress }: Props) {
  const icon = getFileIcon(document.mimeType);
  const size = formatSize(document.size);
  const { bg, text } = getCategoryStyle(document.category);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-3 bg-white"
    >
      {/* File icon */}
      <View className="w-10 h-10 rounded-xl bg-gray-50 items-center justify-center mr-3 shrink-0 border border-gray-100">
        <Text style={{ fontSize: 20, lineHeight: 24 }}>{icon}</Text>
      </View>

      {/* Name + meta */}
      <View className="flex-1 min-w-0">
        <Text
          className="text-gray-900 font-semibold text-sm leading-snug"
          numberOfLines={2}
        >
          {document.name}
        </Text>

        <View className="flex-row items-center gap-2 mt-1 flex-wrap">
          {/* Category badge */}
          <View className={`px-2 py-0.5 rounded-full ${bg}`}>
            <Text className={`text-xs font-medium ${text}`}>{document.category}</Text>
          </View>

          {/* Size */}
          <Text className="text-gray-400 text-xs">{size}</Text>
        </View>
      </View>

      {/* Chevron */}
      <Text className="text-gray-300 text-lg ml-2">›</Text>
    </TouchableOpacity>
  );
}
