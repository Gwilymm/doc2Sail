import { View, Text, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View className="flex-1 bg-base-200 justify-center items-center p-4">
      <Card className={`w-full items-center ${Platform.OS === 'web' ? 'max-w-sm' : ''}`}>
        <Text className="text-5xl mb-3">👤</Text>
        <Text className="text-xl font-bold text-base-content mb-1">
          {user?.displayName ?? 'Utilisateur'}
        </Text>
        {user?.roles.includes('ROLE_ADMIN') && (
          <Badge variant="primary">Admin</Badge>
        )}
        <View className="flex-row gap-4 mt-4 mb-6">
          <View className="items-center">
            <Text className="text-2xl font-bold text-primary">{user?.regattasCount ?? 0}</Text>
            <Text className="text-xs text-base-content/60">Mes régates</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-primary">{user?.sharedRegattasCount ?? 0}</Text>
            <Text className="text-xs text-base-content/60">Partagées</Text>
          </View>
        </View>
        <Button variant="error" onPress={logout} fullWidth>
          Se déconnecter
        </Button>
      </Card>
    </View>
  );
}
