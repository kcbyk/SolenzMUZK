import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getPlaylistItems, removeFromPlaylist } from '../../services/playlistService';
import { usePlayer } from '../../hooks/usePlayer';
import ContentCard from '../../components/content/ContentCard';
import type { ContentItem } from '../../types/index';

interface PlaylistItemExtended extends ContentItem {
  playlistItemId: string;
  position: number;
}

export default function PlaylistDetailScreen() {
  const { id, name: nameParam } = useLocalSearchParams<{ id: string; name?: string }>();
  const player = usePlayer();

  const [items, setItems] = useState<PlaylistItemExtended[]>([]);
  const [playlistName, setPlaylistName] = useState<string>(nameParam ?? 'Playlist');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shuffled, setShuffled] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data: Array<{
        id: string;
        videoId: string;
        title: string;
        channelName: string;
        channelId?: string;
        durationSec: number;
        thumbnailUrl: string | null;
        position: number;
        playlistName?: string;
      }> = await getPlaylistItems(id);

      if (data.length > 0 && data[0].playlistName) {
        setPlaylistName(data[0].playlistName);
      }

      setItems(
        data.map((d) => ({
          playlistItemId: d.id,
          videoId: d.videoId,
          title: d.title,
          channelName: d.channelName,
          channelId: d.channelId,
          durationSec: d.durationSec,
          thumbnailUrl: d.thumbnailUrl,
          position: d.position,
        })),
      );
    } catch {
      setError('Playlist içerikleri yüklenemedi, tekrar deneyin');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handlePlay = (item: ContentItem) => {
    player.playItem(item);
  };

  const handleDeleteItem = (playlistItemId: string, title: string) => {
    Alert.alert(
      'Öğeyi Kaldır',
      `"${title}" içeriğini playlist'ten kaldırmak istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromPlaylist(id, playlistItemId);
              setItems((prev) => prev.filter((i) => i.playlistItemId !== playlistItemId));
            } catch {
              Alert.alert('Hata', 'Öğe kaldırılamadı, tekrar deneyin.');
            }
          },
        },
      ],
    );
  };

  const handleShuffle = () => {
    setShuffled((s) => !s);
    player.toggleShuffle?.();
  };

  const displayItems = shuffled
    ? [...items].sort(() => Math.random() - 0.5)
    : items;

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.subTxt}>Yükleniyor…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTxt}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchItems}>
          <Text style={styles.retryTxt}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading} numberOfLines={1}>{playlistName}</Text>
        <TouchableOpacity
          style={[styles.shuffleBtn, shuffled && styles.shuffleActive]}
          onPress={handleShuffle}
          accessibilityLabel="Karıştır"
        >
          <Text style={styles.shuffleTxt}>🔀</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTxt}>Bu playlist boş</Text>
        </View>
      ) : (
        <FlatList
          data={displayItems}
          keyExtractor={(item) => item.playlistItemId}
          renderItem={({ item }) => (
            <TouchableOpacity
              onLongPress={() => handleDeleteItem(item.playlistItemId, item.title)}
              activeOpacity={1}
            >
              <ContentCard
                item={item}
                onPress={() => handlePlay(item)}
              />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  heading: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#fff' },
  shuffleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  shuffleActive: { backgroundColor: '#1DB954' },
  shuffleTxt: { fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTxt: { color: '#888', fontSize: 14, textAlign: 'center' },
  errorTxt: { color: '#FF6B6B', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  subTxt: { color: '#888', fontSize: 14 },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  retryTxt: { color: '#fff', fontSize: 13 },
  listContent: { paddingVertical: 4 },
  sep: { height: 1, backgroundColor: '#1e1e1e', marginLeft: 108 },
});
