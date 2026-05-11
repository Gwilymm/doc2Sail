import { View } from 'react-native';

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: Props) {
  return (
    <View className={`bg-base-100 rounded-card shadow-sm p-4 ${className}`}>
      {children}
    </View>
  );
}

export function CardBody({ children, className = '' }: Props) {
  return <View className={`gap-2 ${className}`}>{children}</View>;
}
