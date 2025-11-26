import { Text } from '@/components/ui/text';
import { Stack } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

const SCREEN_OPTIONS = {
  title: 'Documents',
  headerShown: true,
};

export default function DocumentsScreen() {
  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <View className="flex-1 items-center justify-center p-4">
        <Text variant="h3">Documents</Text>
        <Text className="mt-2 text-muted-foreground">Coming soon...</Text>
      </View>
    </>
  );
}
