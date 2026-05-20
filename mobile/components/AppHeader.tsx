import { Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAppTheme } from '../theme/useAppTheme';

type Props = {
  title: string;
  subtitle?: string | null;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
};

export function AppHeader({ title, subtitle, icon = 'flag' }: Props) {
  const { colors, isDark } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        paddingHorizontal: 16,
        paddingTop: 52,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.outlineVariant,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0 : 0.05,
        shadowRadius: 3,
        elevation: isDark ? 0 : 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: colors.primaryContainer,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FontAwesome name={icon} size={18} color={colors.onPrimaryContainer} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary, letterSpacing: 0.4 }}>
            Doc2Sail
          </Text>
          <Text style={{ fontSize: 23, fontWeight: '800', color: colors.onSurface, lineHeight: 28 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ fontSize: 13, color: colors.onSurfaceVariant, marginTop: 2 }} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
