import { forwardRef } from 'react';
import { Platform, TextInput, View, Text } from 'react-native';
import type { TextInputProps } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  className?: string;
};

export const Input = forwardRef<TextInput, Props>(function Input({
  label,
  error,
  className = '',
  placeholderTextColor,
  style,
  ...props
}, ref) {
  const { colors } = useAppTheme();

  return (
    <View style={{ gap: 4, width: '100%' }}>
      {label && (
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.onSurface }}>
          {label}
        </Text>
      )}
      <TextInput
        ref={ref}
        className={className}
        placeholderTextColor={placeholderTextColor ?? colors.onSurfaceVariant}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        style={[
          {
            borderWidth: 1,
            borderRadius: 8,
            borderColor: error ? colors.error : colors.inputBorder,
            backgroundColor: colors.inputBg,
            color: colors.onSurface,
            fontSize: 16,
            paddingHorizontal: 12,
            paddingVertical: 12,
          },
          Platform.OS === 'web' ? { outlineStyle: 'none' as any } : null,
          style,
        ]}
        {...props}
      />
      {error && <Text style={{ fontSize: 12, color: colors.error }}>{error}</Text>}
    </View>
  );
});
