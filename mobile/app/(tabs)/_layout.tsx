import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Platform, useWindowDimensions } from 'react-native';
import { CustomTabBar } from '../../components/navigation/CustomTabBar';

function TabIcon({ name, color }: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={24} name={name} color={color} />;
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;

  if (isDesktop) {
    // Desktop: sidebar layout handled by DesktopLayout — tabs still needed for routing
    return (
      <Tabs
        tabBar={() => null}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="regattas" options={{ title: 'Régates', tabBarIcon: ({ color }) => <TabIcon name="flag" color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <TabIcon name="user" color={color} /> }} />
      </Tabs>
    );
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="regattas" options={{ title: 'Régates', tabBarIcon: ({ color }) => <TabIcon name="flag" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <TabIcon name="user" color={color} /> }} />
    </Tabs>
  );
}
