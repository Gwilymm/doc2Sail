import { View, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';

const variants: Record<Variant, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-green-100 text-success',
  warning: 'bg-yellow-100 text-warning',
  error: 'bg-red-100 text-error',
  ghost: 'bg-base-300 text-base-content',
};

type Props = {
  children: React.ReactNode;
  variant?: Variant;
};

export function Badge({ children, variant = 'ghost' }: Props) {
  return (
    <View className={`px-2 py-0.5 rounded-badge self-start ${variants[variant].split(' ')[0]}`}>
      <Text className={`text-xs font-medium ${variants[variant].split(' ')[1]}`}>{children}</Text>
    </View>
  );
}
