import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator, Modal, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getVideoUrl } from '../../services/streamService';
import { formatDuration } from '../../utils/formatDuration';
import type { ContentItem } from '../../types/index';

interface Props {
  item: ContentItem | null;
  visible: boolean;
  onClose: () => void;
  onDownload?: (item: ContentItem, mode: 'audio' | 'video') => void;
}

const QUALITIES = ['360p', '720p', '1080p'] as const;
type Quality = typeof QUALITIES[number];

export default function VideoPlayerScreen({ item, visible, onClose, onDownload }: Props) {
  const [quality, setQuality] = useState<Quality>('720p');
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedPositionRef = useRef(0);

  const player = useVideoPlayer(streamUrl ?? '', (p) => {
    p.loop = false;
    p.play();
  });

  const fetchUrl = useCallback(async (vid: string, q: Quality, savePosition = 0) => {
    setIsLoading(true);
    setLoadError(null);
    const timeout = setTimeout(() => {
      setIsLoading(false);
      if (retryCount < 3) {
        setLoadError('Video yüklenemedi, lütfen tekrar deneyin');
      }
    }, 5000);
    try {
      const url = await getVideoUrl(vid, q);
      clearTimeout(timeout);
      setStreamUrl(url);
      savedPositionRef.current = savePosition;
    } catch {
      clearTimeout(timeout);
      setLoadError('Video yüklenemedi, lütfen tekrar deneyin');
    } finally {
      setIsLoading(false);
    }
  }, [retryCount]);

  useEffect(() => {
    if (visible && item) {
      setRetryCount(0);
      fetchUrl(item.videoId, quality, 0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, item]);

  useEffect(() => {
    if (streamUrl && item) {
      // Quality change — preserve position
      fetchUrl(item.videoId, quality, elapsedSec);
    }
  }, [quality]);

  useEffect(() => {
    if (streamUrl) {
      timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [streamUrl]);

  const handleRetry = () => {
    if (retryCount >= 3) return;
    setRetryCount((c) => c + 1);
    if (item) fetchUrl(item.videoId, quality, elapsedSec);
  };

  if (!item) return null;

  const elapsed = formatDuration(elapsedSec);
  const total = formatDuration(item.durationSec);

  return (
    <Modal visible={visible} animationType="slide" supportedOrientations={['portrait', 'landscape']} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
          <View style={styles.metaBlock}>
            <Text style={styles.metaTitle} numberOfLines={1}>{item.title || 'Bilinmiyor'}</Text>
            <Text style={styles.metaChannel}>{item.channelName || 'Bilinmiyor'}</Text>
          </View>
        </View>

        {/* Video area */}
        <View style={styles.videoArea}>
          {streamUrl ? (
            <VideoView
              style={styles.video}
              player={player}
              allowsFullscreen
              allowsPictureInPicture={false}
            />
          ) : isLoading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <View style={styles.center}>
              <Text style={styles.errorTxt}>{loadError ?? 'Video yüklenemedi'}</Text>
              {retryCount < 3 && (
                <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
                  <Text style={styles.retryTxt}>Tekrar Dene ({3 - retryCount} kez kaldı)</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Text style={styles.timeText}>{elapsed} / {total}</Text>

          {/* Quality selector */}
          <View style={styles.qualityRow}>
            {QUALITIES.map((q) => (
              <TouchableOpacity
                key={q}
                style={[styles.qualityBtn, quality === q && styles.qualityActive]}
                onPress={() => setQuality(q)}
              >
                <Text style={[styles.qualityTxt, quality === q && styles.qualityTxtActive]}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Download buttons */}
          <View style={styles.downloadRow}>
            <TouchableOpacity
              style={styles.dlBtn}
              onPress={() => onDownload?.(item, 'audio')}
            >
              <Text style={styles.dlTxt}>🎵 Sesi İndir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dlBtn}
              onPress={() => onDownload?.(item, 'video')}
            >
              <Text style={styles.dlTxt}>🎬 Videoyu İndir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#121212' },
  closeBtn: { padding: 8 },
  closeTxt: { color: '#fff', fontSize: 20 },
  metaBlock: { flex: 1, marginLeft: 8 },
  metaTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  metaChannel: { color: '#888', fontSize: 12 },
  videoArea: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  video: { width: '100%', height: '100%' },
  center: { alignItems: 'center', padding: 24 },
  errorTxt: { color: '#FF6B6B', textAlign: 'center', marginBottom: 12 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#333', borderRadius: 8 },
  retryTxt: { color: '#fff', fontSize: 13 },
  controls: { backgroundColor: '#121212', padding: 12 },
  timeText: { color: '#888', fontSize: 12, textAlign: 'center', marginBottom: 8 },
  qualityRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  qualityBtn: { paddingHorizontal: 16, paddingVertical: 6, marginHorizontal: 4, borderRadius: 16, backgroundColor: '#2a2a2a' },
  qualityActive: { backgroundColor: '#1DB954' },
  qualityTxt: { color: '#888', fontSize: 13 },
  qualityTxtActive: { color: '#fff', fontWeight: 'bold' },
  downloadRow: { flexDirection: 'row', justifyContent: 'center' },
  dlBtn: { paddingHorizontal: 20, paddingVertical: 10, marginHorizontal: 6, backgroundColor: '#2a2a2a', borderRadius: 8 },
  dlTxt: { color: '#fff', fontSize: 13 },
});
