import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { api, type Regatta } from '@/lib/api';
import { router, Stack } from 'expo-router';
import { PlusIcon, SailboatIcon } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

const SCREEN_OPTIONS = {
  title: 'My Regattas',
  headerShown: true,
};

export default function RegattasScreen() {
  const [regattas, setRegattas] = React.useState<Regatta[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadRegattas = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');

      const data = await api.getMyRegattas();
      setRegattas(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load regattas';
      setError(errorMessage);
      console.error('Error loading regattas:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadRegattas();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderRegattaItem = ({ item }: { item: Regatta }) => (
    <Card className="mb-3">
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        <CardDescription>
          {formatDate(item.startDate)} - {formatDate(item.endDate)}
        </CardDescription>
      </CardHeader>
      {item.description ? (
        <CardContent>
          <Text className="text-sm text-muted-foreground" numberOfLines={2}>
            {item.description}
          </Text>
        </CardContent>
      ) : null}
    </Card>
  );

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={SCREEN_OPTIONS} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="mt-4 text-muted-foreground">Loading regattas...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <View className="flex-1">
        {error ? (
          <View className="flex-1 items-center justify-center p-4">
            <Text className="mb-4 text-center text-destructive">{error}</Text>
            <Button onPress={() => loadRegattas()}>
              <Text>Retry</Text>
            </Button>
          </View>
        ) : regattas.length === 0 ? (
          <View className="flex-1 items-center justify-center p-4">
            <SailboatIcon size={64} className="mb-4 text-muted-foreground" />
            <Text variant="h3" className="mb-2">
              No Regattas Yet
            </Text>
            <Text className="mb-6 text-center text-muted-foreground">
              Create your first regatta to get started
            </Text>
            <Button onPress={() => router.push('/create-regatta')}>
              <PlusIcon size={20} />
              <Text className="ml-2">Create Regatta</Text>
            </Button>
          </View>
        ) : (
          <>
            <FlatList
              data={regattas}
              renderItem={renderRegattaItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerClassName="p-4"
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={() => loadRegattas(true)} />
              }
            />
            <View className="absolute bottom-4 right-4">
              <Button
                size="icon"
                onPress={() => router.push('/create-regatta')}
                className="h-14 w-14 rounded-full shadow-lg">
                <PlusIcon size={24} />
              </Button>
            </View>
          </>
        )}
      </View>
    </>
  );
}
