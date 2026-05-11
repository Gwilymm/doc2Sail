import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

function SkeletonBlock({ className }: { className: string }) {
  return <Animated.View className={`bg-gray-200 rounded-md ${className}`} />;
}

export function SkeletonCard() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 1,
        },
      ]}
      className="bg-white rounded-card px-4 py-4 flex-row items-start"
    >
      {/* Icon placeholder */}
      <View className="w-10 h-10 rounded-full bg-gray-200 mr-3 mt-0.5 shrink-0" />

      {/* Content placeholders */}
      <View className="flex-1 gap-2">
        {/* Title */}
        <SkeletonBlock className="h-5 w-4/5" />
        {/* Shorter second title line */}
        <SkeletonBlock className="h-5 w-2/5" />
        {/* Date */}
        <SkeletonBlock className="h-3.5 w-3/5 mt-1" />
        {/* Location */}
        <SkeletonBlock className="h-3 w-2/5" />
      </View>
    </Animated.View>
  );
}
