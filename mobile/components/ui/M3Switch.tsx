import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme/useAppTheme';

// M3 Switch specs
const TRACK_W = 52;
const TRACK_H = 32;
const TRACK_R = 16;
const THUMB_OFF = 16;
const THUMB_ON = 24;
const THUMB_PADDING = 4; // gap from track edge

// Thumb left edge positions
const THUMB_LEFT_OFF = THUMB_PADDING;                           // 4
const THUMB_LEFT_ON  = TRACK_W - THUMB_PADDING - THUMB_ON;    // 52-4-24 = 24

type Props = {
  value: boolean;
  onValueChange: (v: boolean) => void;
  // M3 color tokens
  trackOnColor?:   string;
  trackOffBorder?: string;
  thumbOnColor?:   string;
  thumbOffColor?:  string;
};

export function M3Switch({
  value,
  onValueChange,
  trackOnColor,
  trackOffBorder,
  thumbOnColor,
  thumbOffColor,
}: Props) {
  const { colors } = useAppTheme();
  const trackOn = trackOnColor ?? colors.primary;
  const trackBorder = trackOffBorder ?? colors.outline;
  const thumbOn = thumbOnColor ?? colors.onPrimary;
  const thumbOff = thumbOffColor ?? colors.outline;
  const progress = useSharedValue(value ? 1 : 0);

  function toggle() {
    const next = !value;
    progress.value = withSpring(next ? 1 : 0, {
      mass: 0.4,
      stiffness: 200,
      damping: 20,
    });
    onValueChange(next);
  }

  // Track background color: off = transparent, on = trackOnColor
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', trackOn],
    ),
    borderWidth: 2 - progress.value * 2, // 2dp border when off, 0 when on
    borderColor: trackBorder,
  }));

  // Thumb: size and position interpolated
  const thumbStyle = useAnimatedStyle(() => {
    const size = THUMB_OFF + (THUMB_ON - THUMB_OFF) * progress.value;
    const left = THUMB_LEFT_OFF + (THUMB_LEFT_ON - THUMB_LEFT_OFF) * progress.value;
    const top  = (TRACK_H - size) / 2;

    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      position: 'absolute' as const,
      left,
      top,
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [thumbOff, thumbOn],
      ),
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    };
  });

  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={{ width: TRACK_W, height: TRACK_H }}
    >
      <Animated.View
        style={[
          {
            width: TRACK_W,
            height: TRACK_H,
            borderRadius: TRACK_R,
            overflow: 'hidden',
          },
          trackStyle,
        ]}
      />
      <Animated.View style={thumbStyle} />
    </Pressable>
  );
}
