import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, useWindowDimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '../../context/ThemeContext';

// --- Layout constants ---
const BAR_HEIGHT = 72;
const FAB_SIZE = 52;
const FAB_PROTRUSION = 16;        // how much FAB sticks above the bar top edge
const FAB_CENTER_GAP = 72;        // width of the empty center zone reserved for FAB
const DIAL_SIZE = 40;
const INDICATOR_W = 64;
const INDICATOR_H = 32;
const ICON_SIZE = 24;
const LABEL_SIZE = 12;
const TOP_PADDING = 10;
const ICON_TO_LABEL = 4;
const FADE_DURATION = 500;
const DIAL_TOUCH_AREA = 260;

// --- Speed dial action type ---
type DialAction = { key: string; label: string; icon: React.ComponentProps<typeof FontAwesome>['name'] };
type TabBarProps = {
  state: any;
  descriptors: Record<string, any>;
  navigation: { navigate: (name: string, params?: object) => void };
};

const ACTIONS_REGATTAS_LIST: DialAction[] = [
  { key: 'new-regatta', label: 'Ajouter une régate', icon: 'flag' },
];

const ACTIONS_REGATTA_DETAIL: DialAction[] = [
  { key: 'upload',  label: 'Ajouter un fichier',     icon: 'file' },
  { key: 'offline', label: 'Télécharger hors ligne',  icon: 'download' },
];

// --- Pill indicator (fade-swap animation) ---
function PillIndicator({ x, color }: { x: number; color: string }) {
  const opacity = useSharedValue(1);
  const displayX = useSharedValue(x);

  useEffect(() => {
    opacity.value = withTiming(0, { duration: FADE_DURATION / 2 }, (finished) => {
      if (finished) {
        displayX.value = x;
        opacity.value = withTiming(1, { duration: FADE_DURATION / 2 });
      }
    });
  }, [x]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    position: 'absolute',
    top: TOP_PADDING,
    left: displayX.value - INDICATOR_W / 2,
    width: INDICATOR_W,
    height: INDICATOR_H,
    borderRadius: INDICATOR_H / 2,
    backgroundColor: color,
  }));

  return <Animated.View style={style} />;
}

// --- Main tab bar ---
export function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const { isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [fabOpen, setFabOpen] = useState(false);

  const SURFACE              = isDark ? '#082437' : '#FFFFFF';
  const ACTIVE_INDICATOR     = isDark ? '#0B4F6C' : '#C7EAF3';
  const ON_PRIMARY_CONTAINER = isDark ? '#C7EAF3' : '#001F2A';
  const ON_SURFACE_VARIANT   = isDark ? '#78919A' : '#4A6572';
  const FAB_COLOR            = isDark ? '#8BD3E8' : '#0B4F6C';
  const FAB_ICON             = isDark ? '#003543' : '#FFFFFF';
  const DIAL_BG              = isDark ? '#0B4F6C' : '#C7EAF3';
  const DIAL_ICON            = isDark ? '#C7EAF3' : '#001F2A';
  const DIAL_LABEL_BG        = isDark ? '#E6E1E5' : '#1C1B1F';
  const DIAL_LABEL_TEXT      = isDark ? '#1C1B1F' : '#FFFFFF';

  const barH = BAR_HEIGHT + insets.bottom;
  const cx   = width / 2;
  const sideW = (width - FAB_CENTER_GAP) / 2;

  // Detect active nested screen to pick FAB actions
  const activeTabRoute = state.routes[state.index];
  const nestedState = activeTabRoute.state as { routes: { name: string }[]; index?: number } | undefined;
  const nestedRoute = nestedState?.routes[nestedState.index ?? 0] as { name: string; params?: { id?: string } } | undefined;
  const nestedRouteName = nestedRoute?.name;
  const isOnDetail = activeTabRoute.name === 'regattas' && nestedRouteName === '[id]';
  const dialActions = isOnDetail ? ACTIONS_REGATTA_DETAIL : ACTIONS_REGATTAS_LIST;
  const pathnameRegattaId = pathname.match(/\/regattas\/([^/]+)/)?.[1];

  function handleDialAction(action: DialAction) {
    setFabOpen(false);
    if (action.key === 'new-regatta') {
      router.push('/regattas/new');
      return;
    }
    if (action.key === 'upload') {
      const regattaId = nestedRoute?.params?.id ?? pathnameRegattaId;
      if (regattaId) {
        router.push(`/regattas/${encodeURIComponent(regattaId)}/upload`);
      }
    }
  }

  // Split routes left / right
  const half = Math.ceil(state.routes.length / 2);
  const leftRoutes  = state.routes.slice(0, half);
  const rightRoutes = state.routes.slice(half);

  // Pill center X for the active tab
  const pillX =
    state.index < leftRoutes.length
      ? (sideW / leftRoutes.length) * (state.index + 0.5)
      : cx + FAB_CENTER_GAP / 2 + (sideW / rightRoutes.length) * (state.index - leftRoutes.length + 0.5);

  function renderTab(route: (typeof state.routes)[number], routeIndex: number) {
    const { options } = descriptors[route.key];
    const isFocused = state.index === routeIndex;
    const label = (options.title ?? route.name) as string;
    const icon = options.tabBarIcon?.({
      color: isFocused ? ON_PRIMARY_CONTAINER : ON_SURFACE_VARIANT,
      size: ICON_SIZE,
      focused: isFocused,
    });

    return (
      <TouchableOpacity
        key={route.key}
        onPress={() => { if (!isFocused) navigation.navigate(route.name, {}); }}
        style={{ flex: 1, alignItems: 'center', paddingTop: TOP_PADDING }}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={label}
      >
        <View style={{ width: INDICATOR_W, height: INDICATOR_H, alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </View>
        <View style={{ marginTop: ICON_TO_LABEL }}>
          <Text
            style={{
              fontSize: LABEL_SIZE,
              fontWeight: isFocused ? '600' : '400',
              color: isFocused ? ON_PRIMARY_CONTAINER : ON_SURFACE_VARIANT,
              letterSpacing: 0.5,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: barH + DIAL_TOUCH_AREA,
        overflow: 'visible',
      }}
    >

      {/* Speed dial */}
      {fabOpen && (
        <View
          style={{
            position: 'absolute',
            bottom: barH + FAB_PROTRUSION + 8,
            alignSelf: 'center',
            alignItems: 'flex-end',
            gap: 12,
            zIndex: 30,
            elevation: 30,
          }}
        >
          {dialActions.map((action) => (
            <TouchableOpacity
              key={action.key}
              onPress={() => handleDialAction(action)}
              activeOpacity={0.82}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View
                style={{
                  backgroundColor: DIAL_LABEL_BG,
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 3,
                  elevation: 3,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: DIAL_LABEL_TEXT, letterSpacing: 0.1 }}>
                  {action.label}
                </Text>
              </View>
              <View
                style={{
                  width: DIAL_SIZE,
                  height: DIAL_SIZE,
                  borderRadius: DIAL_SIZE / 2,
                  backgroundColor: DIAL_BG,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.18,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <FontAwesome name={action.icon} size={16} color={DIAL_ICON} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Scrim */}
      {fabOpen && (
        <Pressable
          style={{ position: 'absolute', top: -800, left: -width, right: -width, bottom: barH, zIndex: 10, elevation: 10 }}
          onPress={() => setFabOpen(false)}
        />
      )}

      {/* Flat bar */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: barH,
          backgroundColor: SURFACE,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: isDark ? 0.25 : 0.06,
          shadowRadius: 4,
          elevation: 8,
        }}
      >
        <PillIndicator x={pillX} color={ACTIVE_INDICATOR} />

        <View style={{ flexDirection: 'row', height: BAR_HEIGHT }}>
          {/* Left tabs */}
          <View style={{ width: sideW, flexDirection: 'row' }}>
            {leftRoutes.map((r: (typeof state.routes)[number], i: number) => renderTab(r, i))}
          </View>

          {/* Center gap for FAB */}
          <View style={{ width: FAB_CENTER_GAP }} />

          {/* Right tabs */}
          <View style={{ width: sideW, flexDirection: 'row' }}>
            {rightRoutes.map((r: (typeof state.routes)[number], i: number) => renderTab(r, half + i))}
          </View>
        </View>
      </View>

      {/* FAB — centered, floating above bar */}
      <TouchableOpacity
        onPress={() => setFabOpen((v) => !v)}
        activeOpacity={0.85}
        style={{
          position: 'absolute',
          bottom: barH - FAB_SIZE + FAB_PROTRUSION,
          left: cx - FAB_SIZE / 2,
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: FAB_SIZE / 2,
          backgroundColor: FAB_COLOR,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: FAB_COLOR,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 10,
          zIndex: 20,
        }}
      >
        <FontAwesome name={fabOpen ? 'times' : 'plus'} size={20} color={FAB_ICON} />
      </TouchableOpacity>

    </View>
  );
}
