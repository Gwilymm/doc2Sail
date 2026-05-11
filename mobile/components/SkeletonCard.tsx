import { useEffect } from 'react';
import { View, useWindowDimensions, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

function Block({ width, height, bg }: { width: ViewStyle['width']; height: number; bg: string }) {
  return (
    <View style={{ width, height, borderRadius: 4, backgroundColor: bg }} />
  );
}

export function SkeletonCard() {
  const { isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const shimmerX = useSharedValue(-screenWidth);

  const cardBg   = isDark ? '#082437' : '#FFFFFF';
  const blockBg  = isDark ? '#143449' : '#E5E7EB';
  const shimmerBg = isDark ? 'rgba(13,42,63,0.55)' : 'rgba(255,255,255,0.55)';

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(screenWidth * 1.5, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, [shimmerX, screenWidth]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { skewX: '-20deg' }],
  }));

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0 : 0.05,
        shadowRadius: 6,
        elevation: isDark ? 0 : 1,
      }}
    >
      {/* Icône placeholder */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: blockBg,
          marginRight: 12,
          marginTop: 2,
          flexShrink: 0,
        }}
      />

      {/* Lignes de texte */}
      <View style={{ flex: 1, gap: 8 }}>
        <Block width="80%" height={20} bg={blockBg} />
        <Block width="40%" height={20} bg={blockBg} />
        <Block width="60%" height={14} bg={blockBg} />
        <Block width="40%" height={12} bg={blockBg} />
      </View>

      {/* Shimmer */}
      <Animated.View
        style={[
          { position: 'absolute', top: 0, bottom: 0, width: 80, backgroundColor: shimmerBg },
          shimmerStyle,
        ]}
      />
    </View>
  );
}
