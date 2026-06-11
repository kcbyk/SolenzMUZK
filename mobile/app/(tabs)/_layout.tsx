import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ label }: { label: string }) {
  return <Text style={{ fontSize: 18 }}>{label}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333333',
        },
        tabBarActiveTintColor: '#1DB954',
        tabBarInactiveTintColor: '#888888',
        headerStyle: { backgroundColor: '#121212' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: () => <TabIcon label="🏠" />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Arama',
          tabBarIcon: () => <TabIcon label="🔍" />,
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          title: 'İndirilenler',
          tabBarIcon: () => <TabIcon label="⬇️" />,
        }}
      />
      <Tabs.Screen
        name="playlists"
        options={{
          title: 'Playlist',
          tabBarIcon: () => <TabIcon label="📋" />,
        }}
      />
    </Tabs>
  );
}
