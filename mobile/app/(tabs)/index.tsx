import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ContentCard from '../../components/content/ContentCard';
import DownloadSheet from '../../components/download/DownloadSheet';
import VideoPlayerScreen from '../../components/player/VideoPlayerScreen';
import { usePlayer } from '../../hooks/usePlayer';
import { getTrending } from '../../services/searchService';
import { useAuthStore } from '../../store/authStore';
import type { ContentItem } from '../../types/index';

const CATEGORIES = [
  { label: 'Müzik', value: 'muzik' },
  { label: 'Oyun', value: 'oyun' },
  { label: 'Eğitim', value: 'egitim' },
  { label: 'Spor', value: 'spor' },
  { label: 'Haberler', value: 'haberler' },
];

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]!.value);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Download sheet state
  const [downloadItem, setDownloadItem] = useState<ContentItem | null>(null);
  const [downloadVisible, setDownloadVisible] = useState(false);

  // Video player state
  const [videoItem, setVideoItem] = useState<ContentItem | null>(null);
  const [videoVisible, setVideoVisible] = useState(false);

  const player = usePlayer();
  const { accessToken } = useAuthStore();

  const fetchItems = useCallback(async (category: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTrending(category, p);
      setItems(data);
    } catch {
      setError('İçerikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(selectedCategory, page);
  }, [selectedCategory, page, fetchItems]);

  const handleCategoryPress = (value: string) => {
    if (value !== selectedCategory) {
      setSelectedCategory(value);
      setPage(1);
    }
  };

  const handleRetry = () => {
    fetchItems(selectedCategory, page);
  };

  const handlePrev = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleNext = () => {
    setPage((p) => p + 1);
  };

  const handleItemPress = (item: ContentItem) => {
    // Items with a channelId or recognisable video-like duration could open VideoPlayerScreen,
    // but by default we play audio. The user can trigger video via the download sheet.
    player.playItem(item);
  };

  const handleDownloadPress = (item: ContentItem) => {
    setDownloadItem(item);
    setDownloadVisible(true);
  };

  const handleVideoDownload = (item: ContentItem, _mode: 'audio' | 'video') => {
    setVideoVisible(false);
    setDownloadItem(item);
    setDownloadVisible(true);
  };

  const renderItem = ({ item }: { item: ContentItem }) => (
    <View style={styles.cardRow}>
      <View style={styles.cardContent}>
        <ContentCard item={item} onPress={() => handleItemPress(item)} />
      </View>
      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={() => handleDownloadPress(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="İndir"
      >
        <Text style={styles.downloadIcon}>⬇️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.chip,
              selectedCategory === cat.value && styles.chipActive,
            ]}
            onPress={() => handleCategoryPress(cat.value)}
          >
            <Text
              style={[
                styles.chipText,
                selectedCategory === cat.value && styles.chipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content area */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF0000" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Bu kategoride henüz içerik yok</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.videoId}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Pagination */}
      {!loading && !error && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
            onPress={handlePrev}
            disabled={page <= 1}
          >
            <Text style={[styles.pageButtonText, page <= 1 && styles.pageButtonTextDisabled]}>
              Önceki
            </Text>
          </TouchableOpacity>
          <Text style={styles.pageLabel}>Sayfa {page}</Text>
          <TouchableOpacity style={styles.pageButton} onPress={handleNext}>
            <Text style={styles.pageButtonText}>Sonraki</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Download sheet */}
      <DownloadSheet
        item={downloadItem}
        visible={downloadVisible}
        onClose={() => setDownloadVisible(false)}
        isAuthenticated={!!accessToken}
      />

      {/* Video player modal */}
      <VideoPlayerScreen
        item={videoItem}
        visible={videoVisible}
        onClose={() => setVideoVisible(false)}
        onDownload={handleVideoDownload}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  categoryRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 4,
  },
  chipActive: {
    backgroundColor: '#FF0000',
  },
  chipText: {
    fontSize: 13,
    color: '#AAAAAA',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FF0000',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginLeft: 108,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  cardContent: {
    flex: 1,
  },
  downloadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  downloadIcon: {
    fontSize: 20,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  pageButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  pageButtonTextDisabled: {
    color: '#888888',
  },
  pageLabel: {
    color: '#888888',
    fontSize: 13,
  },
});
