import { Tabs } from 'expo-router';
import { Home, Settings, Building2, Bell } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthTabLayout() {
  const { isAuthenticated } = useAuth();
  const { data: unreadData } = useUnreadNotifications();
  const unreadCount = isAuthenticated ? (unreadData?.unreadCount || 0) : 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#667eea',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <View style={{ position: 'relative' }}>
              <Home color={color} size={24} />
              {isAuthenticated && unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  backgroundColor: '#ef4444',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Associations',
          tabBarIcon: ({ color }) => <Building2 color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="join"
        options={{
          href: null, // Hide this tab
        }}
      />
    </Tabs>
  );
}