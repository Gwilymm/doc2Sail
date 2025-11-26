import { cn } from '@/lib/utils';
import * as React from 'react';
import { Platform, TextInput, type TextInputProps } from 'react-native';

const Input = React.forwardRef<
  React.ElementRef<typeof TextInput>,
  TextInputProps & {
    placeholderClassName?: string;
  }
>(({ className, placeholderClassName, placeholderTextColor, ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      className={cn(
        'h-10 rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm shadow-black/5',
        Platform.select({
          web: 'outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        }),
        props.editable === false && 'cursor-not-allowed opacity-50',
        className
      )}
      placeholderTextColor={placeholderTextColor ?? '#6b7280'}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
