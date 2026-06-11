import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTrackPlayer } from '../../hooks/useTrackPlayer';
import { formatDuration } from '../../utils/formatDuration';
import AudioPlayerModal from './AudioPlayerModal';

export default function AudioPlayerBar() {
  const { currentItem, isPlaying, togglePlay, skipToNext } = useTrackPlayer();
  const [modalVisible, setModalVisible] = useState(false);

  if (!currentItem) return null;

  return (
    <>
      <TouchableOpacity style={styles.bar} onPress={() => setModalVisible(true)} activeOpacity={0.9}>
        {currentItem.thumbnailUrl ? (
          <Image source={{ uri: currentItem.thumbnailUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Text>🎵</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{currentItem.title}</Text>
          <Text style={styles.channel} numberOfLines={1}>{currentItem.channelName}</Text>
        </View>
        <TouchableOpacity onPress={togglePlay} style={styles.btn}>
          <Text style={styles.btnText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={skipToNext} style={styles.btn}>
          <Text style={styles.btnText}>⏭</Text>
        </TouchableOpacity>
      </TouchableOpacity>
      <AudioPlayerModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#333',
  },
  thumb: { width: 40, height: 40, borderRadius: 4, backgroundColor: '#2a2a2a' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginHorizontal: 10 },
  title: { fontSize: 13, fontWeight: 'bold', color: '#fff' },
  channel: { fontSize: 11, color: '#888', marginTop: 2 },
  btn: { padding: 8 },
  btnText: { fontSize: 20, color: '#fff' },
});
