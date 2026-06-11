import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  downloadId: string;
  title: string;
  progressPct: number;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  downloading: '#1DB954', completed: '#1DB954', failed: '#FF4444',
  pending: '#888', paused: '#FFA500',
};

const STATUS_LABELS: Record<string, string> = {
  downloading: 'İndiriliyor', completed: 'Tamamlandı',
  failed: 'Hata', pending: 'Bekliyor', paused: 'Duraklatıldı',
};

export default function DownloadProgressItem({ title, progressPct, status }: Props) {
  const color = STATUS_COLORS[status] ?? '#888';
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeTxt}>{STATUS_LABELS[status] ?? status}</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(progressPct, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.pct}>{progressPct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#1a1a1a', borderRadius: 8, marginVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  title: { flex: 1, color: '#fff', fontSize: 13, fontWeight: 'bold' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeTxt: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  track: { height: 4, backgroundColor: '#333', borderRadius: 2 },
  fill: { height: 4, borderRadius: 2 },
  pct: { color: '#888', fontSize: 11, marginTop: 4, textAlign: 'right' },
});
