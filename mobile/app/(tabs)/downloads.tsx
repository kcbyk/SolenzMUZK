import React, { useEffect, useState } from 'react';
import {
  Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import api from '../../services/api';
import { useDownloadStore } from '../../store/downloadStore';
import { useAuthStore } from '../../store/authStore';
import { usePlayer } from '../../hooks/usePlayer';
import VideoPlayerScreen from '../../components/player/VideoPlayerScreen';
import DownloadProgressItem from '../../components/download/DownloadProgressItem';
import DownloadSheet from '../../components/download/DownloadSheet';
import type { ContentItem } from '../../types/index';

interface ApiDownload {
  id: string;
  video_id: string;
  title: string;
  channel_name: string;
  duration_sec: number;
  thumbnail_url: string | null;
  format: string;
  quality: string;
  file_size_bytes: number;
  status: string;
  progress_pct: number;
}

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState<ApiDownload[]>([]);
  const [storage, setStorage] = useState<{ totalBytes: number; formatted: string }>({
    totalBytes: 0,
    formatted: '0.00 MB',
  });
  const [videoItem, setVideoItem] = useState<ContentItem | null>(null);
  const [videoVisible, setVideoVisible] = useState(false);
  const [downloadSheetItem, setDownloadSheetItem] = useState<ContentItem | null>(null);
  const [downloadSheetVisible, setDownloadSheetVisible] = useState(false);

  const { activeDownloads } = useDownloadStore();
  const { accessToken } = useAuthStore();
  const player = usePlayer();

  const fetchDownloads = async () => {
    try {
      const [dlRes, storRes] = await Promise.all([
        api.get<{ downloads: ApiDownload[] }>('/api/downloads'),
        api.get<{ totalBytes: number; formatted: string }>('/api/users/me/storage'),
      ]);
      setDownloads(dlRes.data.downloads);
      setStorage(storRes.data);
    } catch {
      // user not logged in or network error
    }
  };

  useEffect(() => {
    if (accessToken) fetchDownloads();
  }, [accessToken]);

  const handleDelete = (id: string) => {
    Alert.alert(
      'İçeriği Sil',
      'Bu içeriği silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/downloads/${id}`);
              setDownloads((ds) => ds.filter((d) => d.id !== id));
            } catch {
              Alert.alert('Hata', 'İçerik silinemedi, tekrar deneyin.');
            }
          },
        },
      ],
    );
  };

  const handlePlay = (d: ApiDownload) => {
    const item: ContentItem = {
      videoId: d.video_id,
      title: d.title,
      channelName: d.channel_name,
      durationSec: d.duration_sec,
      thumbnailUrl: d.thumbnail_url,
    };
    if (d.format === 'mp4') {
      setVideoItem(item);
      setVideoVisible(true);
    } else {
      player.playItem(item);
    }
  };

  const handleVideoDownload = (item: ContentItem, mode: 'audio' | 'video') => {
    setVideoVisible(false);
    setDownloadSheetItem(item);
    setDownloadSheetVisible(true);
  };

  const activeList = Array.from(activeDownloads.entries()).map(([id, v]) => ({ id, ...v }));
  const completed = downloads.filter((d) => d.status === 'completed');

  if (!accessToken) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTxt}>İndirilenlerinizi görmek için giriş yapın</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>İndirilenler</Text>
        <Text style={styles.storage}>{storage.formatted}</Text>
      </View>

      {/* Active downloads */}
      {activeList.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aktif İndirmeler</Text>
          {activeList.map((d) => (
            <DownloadProgressItem
              key={d.id}
              downloadId={d.id}
              title={d.id}
              progressPct={d.progressPct}
              status={d.status}
            />
          ))}
        </View>
      )}

      {/* Completed downloads */}
      {completed.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTxt}>Henüz indirilmiş içerik yok</Text>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tamamlananlar</Text>
          </View>
          <FlatList
            data={completed}
            keyExtractor={(d) => d.id}
            renderItem={({ item: d }) => (
              <TouchableOpacity style={styles.item} onPress={() => handlePlay(d)} activeOpacity={0.7}>
                {d.thumbnail_url ? (
                  <Image source={{ uri: d.thumbnail_url }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Text style={styles.thumbIcon}>{d.format === 'mp4' ? '🎬' : '🎵'}</Text>
                  </View>
                )}
                <View style={styles.info}>
                  <Text style={styles.title} numberOfLines={2}>{d.title}</Text>
                  <Text style={styles.meta}>{d.channel_name}</Text>
                  <View style={styles.badges}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeTxt}>{d.format.toUpperCase()}</Text>
                    </View>
                    <View style={styles.badge}>
                      <Text style={styles.badgeTxt}>{d.quality}</Text>
                    </View>
                    <Text style={styles.meta}>
                      {(d.file_size_bytes / 1024 / 1024).toFixed(1)} MB
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(d.id)}
                  style={styles.delBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.delTxt}>🗑</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        </>
      )}

      {/* Video player modal */}
      <VideoPlayerScreen
        item={videoItem}
        visible={videoVisible}
        onClose={() => setVideoVisible(false)}
        onDownload={handleVideoDownload}
      />

      {/* Download sheet (triggered from video player) */}
      <DownloadSheet
        item={downloadSheetItem}
        visible={downloadSheetVisible}
        onClose={() => setDownloadSheetVisible(false)}
        isAuthenticated={!!accessToken}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  heading: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  storage: { fontSize: 12, color: '#888' },
  section: { padding: 12 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  sectionTitle: { color: '#888', fontSize: 13, marginBottom: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTxt: { color: '#888', fontSize: 14, textAlign: 'center' },
  listContent: { paddingVertical: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 4,
    backgroundColor: '#2a2a2a',
  },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  thumbIcon: { fontSize: 24 },
  info: { flex: 1, marginHorizontal: 10 },
  title: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  meta: { color: '#888', fontSize: 11 },
  badges: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  badge: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeTxt: { color: '#aaa', fontSize: 10 },
  delBtn: { padding: 8 },
  delTxt: { fontSize: 18 },
  sep: { height: 1, backgroundColor: '#1e1e1e', marginLeft: 100 },
});
