import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setupTrackPlayer } from '../services/trackPlayerService';
import AudioPlayerBar from '../components/player/AudioPlayerBar';

export default function RootLayout() {
  useEffect(() => {
    setupTrackPlayer().catch((err) =>
      console.error('TrackPlayer setup failed:', err)
    );
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#121212' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#121212' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: 'Giriş Yap' }} />
        <Stack.Screen name="auth/register" options={{ title: 'Kayıt Ol' }} />
        <Stack.Screen
          name="channel/[channelId]"
          options={{ title: 'Kanal' }}
        />
        <Stack.Screen
          name="playlist/[id]"
          options={{ title: 'Playlist' }}
        />
      </Stack>
      <AudioPlayerBar />
    </>
  );
}
