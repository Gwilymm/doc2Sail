import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth-context';
import { router, Stack } from 'expo-router';
import {
  CalendarIcon,
  CloudRainIcon,
  FileTextIcon,
  LogInIcon,
  LogOutIcon,
  MoonStarIcon,
  SailboatIcon,
  SearchIcon,
  SunIcon,
  TrendingUpIcon,
  WindIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

const SCREEN_OPTIONS = {
  title: 'Doc2Sail',
  headerShown: false,
};

// Fake weather data
const WEATHER_DATA = {
  temperature: 18,
  condition: 'Partly Cloudy',
  windSpeed: 12,
  windDirection: 'NE',
  humidity: 65,
  visibility: 10,
};

export default function Screen() {
  const { user, isLoading, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={SCREEN_OPTIONS} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Stack.Screen options={SCREEN_OPTIONS} />
        <View className="flex-1 items-center justify-center gap-8 p-4">
          <View className="gap-4 p-4">
            <Text variant="h1">Welcome to Doc2Sail</Text>
            <Text className="text-center text-muted-foreground">Please sign in to continue</Text>
          </View>

          <Button onPress={() => router.push('/sign-in')}>
            <Text>Sign In</Text>
            <Icon as={LogInIcon} />
          </Button>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <ScrollView className="flex-1 bg-background">
        {/* Header */}
        <View className="bg-primary px-6 pb-8 pt-16">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-primary-foreground">Welcome back!</Text>
              <Text className="text-primary-foreground/80">{user.displayName || user.email}</Text>
            </View>
            <View className="flex-row gap-2">
              <ThemeToggle />
              <Button onPress={signOut} size="icon" variant="ghost" className="rounded-full">
                <Icon as={LogOutIcon} className="text-primary-foreground" />
              </Button>
            </View>
          </View>

          {/* Search Bar */}
          <View className="relative">
            <Input
              placeholder="Search regattas or documents..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="bg-background/95 pl-12"
            />
            <View className="absolute left-3 top-2.5">
              <Icon as={SearchIcon} className="text-muted-foreground" size={20} />
            </View>
          </View>
        </View>

        <View className="p-6">
          {/* Weather Widget */}
          <Card className="mb-6 overflow-hidden">
            <CardHeader className="pb-3">
              <View className="flex-row items-center justify-between">
                <CardTitle>Weather Conditions</CardTitle>
                <Icon as={CloudRainIcon} className="text-primary" size={24} />
              </View>
            </CardHeader>
            <CardContent>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-4xl font-bold">{WEATHER_DATA.temperature}°C</Text>
                  <Text className="text-muted-foreground">{WEATHER_DATA.condition}</Text>
                </View>
                <View className="gap-2">
                  <View className="flex-row items-center gap-2">
                    <Icon as={WindIcon} size={16} className="text-muted-foreground" />
                    <Text className="text-sm">
                      {WEATHER_DATA.windSpeed} kt {WEATHER_DATA.windDirection}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Icon as={TrendingUpIcon} size={16} className="text-muted-foreground" />
                    <Text className="text-sm">{WEATHER_DATA.humidity}% humidity</Text>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Text className="mb-3 text-lg font-semibold">Quick Actions</Text>
          <View className="mb-6 flex-row gap-3">
            <Pressable
              onPress={() => router.push('/regattas')}
              className="flex-1 active:opacity-80">
              <Card>
                <CardContent className="items-center py-6">
                  <View className="mb-3 rounded-full bg-primary/10 p-3">
                    <Icon as={SailboatIcon} className="text-primary" size={28} />
                  </View>
                  <Text className="font-medium">My Regattas</Text>
                </CardContent>
              </Card>
            </Pressable>

            <Pressable
              onPress={() => router.push('/documents')}
              className="flex-1 active:opacity-80">
              <Card>
                <CardContent className="items-center py-6">
                  <View className="mb-3 rounded-full bg-blue-500/10 p-3">
                    <Icon as={FileTextIcon} className="text-blue-500" size={28} />
                  </View>
                  <Text className="font-medium">Documents</Text>
                </CardContent>
              </Card>
            </Pressable>
          </View>

          {/* Recent Activity */}
          <Text className="mb-3 text-lg font-semibold">Recent Activity</Text>
          <Card className="mb-4">
            <CardContent className="py-4">
              <View className="flex-row items-center gap-3">
                <View className="rounded-full bg-green-500/10 p-2">
                  <Icon as={CalendarIcon} className="text-green-500" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="font-medium">No recent activity</Text>
                  <Text className="text-sm text-muted-foreground">
                    Create a regatta to get started
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Stats */}
          <View className="flex-row gap-3">
            <Card className="flex-1">
              <CardContent className="items-center py-4">
                <Text className="text-3xl font-bold">0</Text>
                <Text className="text-sm text-muted-foreground">Regattas</Text>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="items-center py-4">
                <Text className="text-3xl font-bold">0</Text>
                <Text className="text-sm text-muted-foreground">Documents</Text>
              </CardContent>
            </Card>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonStarIcon,
};

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <Button
      onPressIn={toggleColorScheme}
      size="icon"
      variant="ghost"
      className="ios:size-9 rounded-full web:mx-4">
      <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-5" />
    </Button>
  );
}
