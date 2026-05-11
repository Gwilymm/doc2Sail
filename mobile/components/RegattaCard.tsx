import { TouchableOpacity, View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Regatta } from '../hooks/useRegattas';

type Props = {
  regatta: Regatta;
  onPress: () => void;
};

function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString('fr-FR', { month: 'long' });
  const endMonth = end.toLocaleDateString('fr-FR', { month: 'long' });
  const endYear = end.getFullYear();

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay} – ${endDay} ${endMonth} ${endYear}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`;
}

export function RegattaCard({ regatta, onPress }: Props) {
  const { isDark } = useTheme();
  const dateRange = formatDateRange(regatta.startDate, regatta.endDate);

  const colors = isDark ? {
    surface:          '#082437',
    onSurface:        '#EAF7FA',
    onSurfaceVariant: '#78919A',
    accent:           '#0D2A3F',
    primary:          '#8BD3E8',
    chevron:          '#31515D',
  } : {
    surface:          '#FFFFFF',
    onSurface:        '#071D2B',
    onSurfaceVariant: '#4A6572',
    accent:           '#EAF3F5',
    primary:          '#0B4F6C',
    chevron:          '#D3E0E4',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0 : 0.07,
        shadowRadius: 6,
        elevation: isDark ? 0 : 2,
      }}
    >
      {/* Sailing accent */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          marginTop: 2,
          flexShrink: 0,
        }}
      >
        <Text style={{ fontSize: 20, lineHeight: 24 }}>⛵</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 18, fontWeight: '700', color: colors.onSurface, lineHeight: 24 }}
          numberOfLines={2}
        >
          {regatta.name}
        </Text>

        <Text style={{ fontSize: 14, color: colors.primary, marginTop: 4 }}>{dateRange}</Text>

        {regatta.description ? (
          <Text
            style={{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 8, lineHeight: 18 }}
            numberOfLines={2}
          >
            {regatta.description}
          </Text>
        ) : null}
      </View>

      {/* Chevron */}
      <Text style={{ fontSize: 20, color: colors.chevron, marginLeft: 8, marginTop: 4 }}>›</Text>
    </TouchableOpacity>
  );
}
