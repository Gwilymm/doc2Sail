import { useEffect } from 'react';
import { View, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const CONTAINER_HEIGHT = 80;
const INDICATOR_W = 64;
const INDICATOR_H = 32;
const ICON_SIZE = 24;
const LABEL_SIZE = 12;
const TOP_PADDING = 12;
const ICON_TO_LABEL = 4;
const FADE_DURATION = 500;

const SURFACE = '#ffffff';
const ACTIVE_INDICATOR = '#bae6fd';
const ON_PRIMARY_CONTAINER = '#0c4a6e';
const ON_SURFACE_VARIANT = '#64748b';
const OUTLINE_VARIANT = '#e2e8f0';

function PillIndicator({ index, tabW }: { index: number; tabW: number }) {
  const opacity = useSharedValue(1);
  const displayIndex = useSharedValue(index);

  useEffect(() => {
    // Fade out → swap position → fade in
    opacity.value = withTiming(0, { duration: FADE_DURATION / 2 }, (finished) => {
      if (finished) {
        displayIndex.value = index;
        opacity.value = withTiming(1, { duration: FADE_DURATION / 2 });
      }
    });
  }, [index]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    position: 'absolute',
    top: TOP_PADDING,
    left: (displayIndex.value + 0.5) * tabW - INDICATOR_W / 2,
    width: INDICATOR_W,
    height: INDICATOR_H,
    borderRadius: INDICATOR_H / 2,
    backgroundColor: ACTIVE_INDICATOR,
  }));

  return <Animated.View style={style} />;
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const tabCount = state.routes.length;
  const tabW = width / tabCount;
  const containerH = CONTAINER_HEIGHT + insets.bottom;

  return (
    <View
      style={{
        height: containerH,
        backgroundColor: SURFACE,
        borderTopWidth: 1,
        borderTopColor: OUTLINE_VARIANT,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      }}
    >
      <PillIndicator index={state.index} tabW={tabW} />

      <View style={{ flexDirection: 'row', height: CONTAINER_HEIGHT }}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
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
        })}
      </View>
    </View>
  );
}
