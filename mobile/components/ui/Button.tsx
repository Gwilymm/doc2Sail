import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'error' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, { btn: string; text: string }> = {
  primary: { btn: 'bg-primary active:bg-primary-focus', text: 'text-white' },
  secondary: { btn: 'bg-secondary active:opacity-80', text: 'text-white' },
  ghost: { btn: 'bg-transparent active:bg-base-300', text: 'text-base-content' },
  error: { btn: 'bg-red-100 active:bg-red-200', text: 'text-error' },
  outline: { btn: 'bg-transparent border border-primary active:bg-base-200', text: 'text-primary' },
};

const sizeClasses: Record<Size, { btn: string; text: string }> = {
  sm: { btn: 'px-3 py-2', text: 'text-sm' },
  md: { btn: 'px-4 py-3', text: 'text-base' },
  lg: { btn: 'px-6 py-4', text: 'text-lg' },
};

type Props = {
  onPress?: () => void;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
};

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
}: Props) {
  const { colors, isDark } = useAppTheme();
  const { btn, text } = variantClasses[variant];
  const { btn: btnSize, text: textSize } = sizeClasses[size];
  const primaryBg = isDark ? colors.primaryContainer : colors.primary;
  const primaryText = isDark ? colors.onPrimaryContainer : colors.onPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-btn items-center justify-center flex-row gap-2 ${btn} ${btnSize} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-60' : ''} ${className}`}
      style={variant === 'primary' ? { backgroundColor: primaryBg } : undefined}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' ? primaryText : colors.primary} />}
      <Text
        className={`font-semibold ${text} ${textSize}`}
        style={variant === 'primary' ? { color: primaryText } : undefined}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}
