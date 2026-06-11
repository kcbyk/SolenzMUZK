import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getChannelVideos } from '../../services/searchService';
import { usePlayer } from '../../hooks/usePlayer';
import ContentCard from '../../components/content/ContentCard';
import type { ContentItem } from '../../types/index';

const PAGE_SIZE = 20;

export default function ChannelScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const player = usePlayer();

  const [items, setItems] = useState<ContentItem[]>([]);
  const [channelName, setChannelName] = useState<string>('Kanal');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef(false);

  const fetchPage = useCallback(
    async (pageNum: number, reset = false) => {
      if (!channelId || isFetching.current) return;
      isFetching.current = true;

      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const data = await getChannelVideos(channelId, pageNum);

        setItems((prev) => (reset ? data : [...prev, ...data]));

        if (data.length > 0 && reset) {
          setChannelName(data[0].channelName);
        }

        if (data.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } catch {
        if (reset) {
          setError('Kanal içerikleri yüklenemedi, tekrar deneyin');
        }
        // On pagination error just stop; user can pull-to-refresh
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetching.current = false;
      }
    },
    [channelId],
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setItems([]);
    fetchPage(1, true);
  }, [fetchPage]);

  const handleEndReached = () => {
    if (!hasMore || loadingMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage, false);
  };

  const handleRetry = () => {
    setPage(1);
    setHasMore(true);
    setItems([]);
    fetchPage(1, true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTxt}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
          <Text style={styles.retryTxt}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Channel header */}
      <View style={styles.header}>
        <Text style={styles.channelName} numberOfLines={1}>{channelName}</Text>
        <Text style={styles.itemCount}>{items.length} video</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTxt}>Bu kanalda video bulunamadı</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.videoId}-${index}`}
          renderItem={({ item }) => (
            <ContentCard
              item={item}
              onPress={() => player.playItem(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={styles.listContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color="#1DB954" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  channelName: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  itemCount: { fontSize: 12, color: '#888' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTxt: { color: '#888', fontSize: 14, textAlign: 'center' },
  errorTxt: { color: '#FF6B6B', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  retryTxt: { color: '#fff', fontSize: 13 },
  listContent: { paddingVertical: 4 },
  sep: { height: 1, backgroundColor: '#1e1e1e', marginLeft: 108 },
  footer: { padding: 16, alignItems: 'center' },
});
