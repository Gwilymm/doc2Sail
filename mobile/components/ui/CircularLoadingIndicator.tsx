import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '../../theme/useAppTheme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Séquence de 7 formes du M3 Loading Indicator (Material 3 Expressive)
// Chaque tableau = 8 rayons normalisés aux angles 0°, 45°, 90°… 315° depuis le haut
// Séquence : soft burst → cookie 9pt → pentagone → pilule → sunny → cookie 4pt → ovale
const SHAPES: number[][] = [
  [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],         // cercle
  [1.22, 1.06, 0.78, 1.06, 1.22, 1.06, 0.78, 1.06],  // ovale horizontal
  [1.2, 0.8, 1.2, 0.8, 1.2, 0.8, 1.2, 0.8],           // soft burst 4pt
  [0.78, 1.06, 1.22, 1.06, 0.78, 1.06, 1.22, 1.06],  // pilule vertical
  [1.35, 0.65, 1.35, 0.65, 1.35, 0.65, 1.35, 0.65],  // sunny (étoile prononcée)
  [1.12, 0.9, 1.12, 0.9, 1.12, 0.9, 1.12, 0.9],       // cookie (doux)
  [1.18, 0.8, 0.92, 1.08, 0.82, 1.08, 0.92, 0.8],    // pentagone-ish
];

// Cosinus/sinus précalculés pour les 8 angles (UI thread ne refait pas les trig)
const COS8 = Array.from({ length: 8 }, (_, i) =>
  Math.cos(-Math.PI / 2 + (i * Math.PI) / 4)
);
const SIN8 = Array.from({ length: 8 }, (_, i) =>
  Math.sin(-Math.PI / 2 + (i * Math.PI) / 4)
);

const N_SHAPES = SHAPES.length;
// Spec M3 : 650ms par forme, rotation 140° par forme → 360° / (140/650) ≈ 1671ms/tour
const MS_PER_SHAPE = 650;
const MS_PER_TURN = 1671;

type Props = {
  size?: number;
  color?: string;
  containerColor?: string;
};

export function M3LoadingIndicator({
  size = 52,
  color,
  containerColor,
}: Props) {
  const { colors } = useAppTheme();
  const indicatorColor = color ?? colors.primary;
  const indicatorContainerColor = containerColor ?? colors.surfaceContainerHigh;
  const morph = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    morph.value = withRepeat(
      withTiming(N_SHAPES, { duration: N_SHAPES * MS_PER_SHAPE, easing: Easing.linear }),
      -1,
      false
    );
    rotation.value = withRepeat(
      withTiming(360, { duration: MS_PER_TURN, easing: Easing.linear }),
      -1,
      false
    );
  }, [morph, rotation]);

  const containerRadius = size * 0.28;
  const shapeRadius = size * 0.29; // rayon du blob
  const cx = size / 2;
  const cy = size / 2;

  const rotStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Calcul du chemin SVG morphé, sur le UI thread
  const pathProps = useAnimatedProps(() => {
    'worklet';
    const raw = morph.value;
    const idx = Math.floor(raw) % N_SHAPES;
    const nxt = (idx + 1) % N_SHAPES;
    const t = raw - Math.floor(raw);

    const s1 = SHAPES[idx];
    const s2 = SHAPES[nxt];

    // Points du blob interpolé
    const px: number[] = [];
    const py: number[] = [];
    for (let i = 0; i < 8; i++) {
      const r = s1[i] + (s2[i] - s1[i]) * t;
      px[i] = cx + r * shapeRadius * COS8[i];
      py[i] = cy + r * shapeRadius * SIN8[i];
    }

    // Chemin lisse via midpoints + courbes quadratiques de Bézier
    const mx: number[] = [];
    const my: number[] = [];
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8;
      mx[i] = (px[i] + px[j]) / 2;
      my[i] = (py[i] + py[j]) / 2;
    }

    let d = `M${mx[7].toFixed(1)} ${my[7].toFixed(1)}`;
    for (let i = 0; i < 8; i++) {
      d += ` Q${px[i].toFixed(1)} ${py[i].toFixed(1)} ${mx[i].toFixed(1)} ${my[i].toFixed(1)}`;
    }
    d += 'Z';
    return { d };
  });

  return (
    <View style={{ width: size, height: size }}>
      {/* Conteneur arrondi (surface M3) */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: containerRadius,
          backgroundColor: indicatorContainerColor,
        }}
      />
      {/* Blob rotatif */}
      <Animated.View style={[{ width: size, height: size }, rotStyle]}>
        <Svg width={size} height={size}>
          <AnimatedPath fill={indicatorColor} animatedProps={pathProps} />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function CenteredLoader({
  size = 52,
  color,
}: Omit<Props, 'containerColor'>) {
  const { colors } = useAppTheme();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <M3LoadingIndicator size={size} color={color ?? colors.primary} containerColor={colors.surfaceContainerHigh} />
    </View>
  );
}
