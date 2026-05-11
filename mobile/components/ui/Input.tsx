import { TextInput, View, Text, forwardRef } from 'react-native';
import type { TextInputProps } from 'react-native';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  className?: string;
};

export const Input = forwardRef<TextInput, Props>(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <View className="gap-1 w-full">
      {label && <Text className="text-sm font-medium text-base-content">{label}</Text>}
      <TextInput
        ref={ref}
        className={`border rounded-btn px-3 py-3 text-base bg-base-200 text-base-content ${
          error ? 'border-error' : 'border-base-300'
        } ${className}`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="text-xs text-error">{error}</Text>}
    </View>
  );
});
