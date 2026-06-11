import React from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTrackPlayer } from '../../hooks/useTrackPlayer';
import { formatDuration } from '../../utils/formatDuration';

interface Props { visible: boolean; onClose: () => void; }

export default function AudioPlayerModal({ visible, onClose }: Props) {
  const {
    currentItem, isPlaying, progress, isShuffle,
    togglePlay, skipToNext, skipToPrevious, toggleShuffle, setVolume
  } = useTrackPlayer();

  if (!currentItem) return null;

  const elapsed = formatDuration(Math.floor(progress.position));
  const total = formatDuration(currentItem.durationSec);
  const progressPct = currentItem.durationSec > 0
    ? (progress.position / currentItem.durationSec) * 100 : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>

        {currentItem.thumbnailUrl ? (
          <Image source={{ uri: currentItem.thumbnailUrl }} style={styles.artwork} />
        ) : (
          <View style={[styles.artwork, styles.artPlaceholder]}>
            <Text style={{ fontSize: 60 }}>🎵</Text>
          </View>
        )}

        <Text style={styles.title} numberOfLines={2}>{currentItem.title}</Text>
        <Text style={styles.channel}>{currentItem.channelName}</Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(progressPct, 100)}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{elapsed}</Text>
            <Text style={styles.timeText}>{total}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={skipToPrevious} style={styles.ctrlBtn}>
            <Text style={styles.ctrlTxt}>⏮</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={togglePlay} style={[styles.ctrlBtn, styles.playBtn]}>
            <Text style={[styles.ctrlTxt, { fontSize: 32 }]}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={skipToNext} style={styles.ctrlBtn}>
            <Text style={styles.ctrlTxt}>⏭</Text>
          </TouchableOpacity>
        </View>

        {/* Volume */}
        <View style={styles.volRow}>
          <Text style={styles.volLabel}>🔇</Text>
          {[0, 25, 50, 75, 100].map((v) => (
            <TouchableOpacity key={v} onPress={() => setVolume(v)} style={styles.volBtn}>
              <Text style={styles.volBtnTxt}>{v}%</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.volLabel}>🔊</Text>
        </View>

        {/* Shuffle */}
        <TouchableOpacity onPress={toggleShuffle} style={[styles.shuffleBtn, isShuffle && styles.shuffleActive]}>
          <Text style={styles.shuffleTxt}>🔀 {isShuffle ? 'Karışık Açık' : 'Karışık Kapalı'}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  closeBtn: { position: 'absolute', top: 16, right: 20, padding: 8 },
  closeTxt: { color: '#fff', fontSize: 20 },
  artwork: { width: 200, height: 200, borderRadius: 12, marginBottom: 24, backgroundColor: '#2a2a2a' },
  artPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  channel: { fontSize: 14, color: '#888', marginBottom: 24 },
  progressContainer: { width: '100%', marginBottom: 24 },
  progressTrack: { height: 4, backgroundColor: '#333', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#1DB954', borderRadius: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  timeText: { fontSize: 12, color: '#888' },
  controls: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  ctrlBtn: { padding: 12 },
  playBtn: { marginHorizontal: 24 },
  ctrlTxt: { fontSize: 28, color: '#fff' },
  volRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  volLabel: { fontSize: 18, marginHorizontal: 4 },
  volBtn: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#2a2a2a', borderRadius: 8, marginHorizontal: 2 },
  volBtnTxt: { color: '#fff', fontSize: 11 },
  shuffleBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#2a2a2a' },
  shuffleActive: { backgroundColor: '#1DB954' },
  shuffleTxt: { color: '#fff', fontSize: 13 },
});
