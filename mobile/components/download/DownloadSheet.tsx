import React, { useState } from 'react';
import {
  ActivityIndicator, Modal, Platform, StyleSheet, Text,
  ToastAndroid, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import type { ContentItem } from '../../types/index';

interface Props {
  item: ContentItem | null;
  visible: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  initialMode?: 'audio' | 'video'; // pre-select format if coming from video player
}

type Step = 'format' | 'quality';
type Format = 'mp3' | 'mp4';

const AUDIO_QUALITIES = ['128kbps', '192kbps', '320kbps'];
const VIDEO_QUALITIES = ['360p', '720p', '1080p'];

export default function DownloadSheet({ item, visible, onClose, isAuthenticated, initialMode }: Props) {
  const [step, setStep] = useState<Step>(initialMode ? 'quality' : 'format');
  const [format, setFormat] = useState<Format>(initialMode === 'video' ? 'mp4' : 'mp3');
  const [quality, setQuality] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const qualities = format === 'mp3' ? AUDIO_QUALITIES : VIDEO_QUALITIES;

  const showToast = (msg: string) => {
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
    else setMessage(msg);
  };

  const handleDownload = async () => {
    if (!item || !quality) return;
    setLoading(true);
    setMessage('');
    try {
      await api.post('/api/downloads', {
        videoId: item.videoId,
        format,
        quality,
        title: item.title,
        channelName: item.channelName,
        durationSec: item.durationSec,
        thumbnailUrl: item.thumbnailUrl,
      });
      showToast('İndirme başladı');
      onClose();
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code;
      if (code === 'ALREADY_DOWNLOADED') setMessage('Bu içerik zaten indirildi');
      else if (code === 'DOWNLOAD_LIMIT') setMessage('En fazla 3 indirme aynı anda yapılabilir');
      else setMessage('İndirme başlatılamadı, tekrar deneyin');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(initialMode ? 'quality' : 'format');
    setFormat(initialMode === 'video' ? 'mp4' : 'mp3');
    setQuality('');
    setMessage('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>
          {!isAuthenticated ? 'Giriş Gerekli' : step === 'format' ? 'Format Seç' : 'Kalite Seç'}
        </Text>

        {!isAuthenticated ? (
          <View style={styles.authBlock}>
            <Text style={styles.authMsg}>İndirmek için giriş yapmanız gerekiyor.</Text>
            <TouchableOpacity style={styles.authBtn} onPress={() => { handleClose(); router.push('/auth/login'); }}>
              <Text style={styles.authBtnTxt}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        ) : step === 'format' ? (
          <View style={styles.optionRow}>
            <TouchableOpacity style={styles.optBtn} onPress={() => { setFormat('mp3'); setStep('quality'); }}>
              <Text style={styles.optIcon}>🎵</Text>
              <Text style={styles.optTxt}>Yalnızca Ses</Text>
              <Text style={styles.optSub}>MP3/AAC</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optBtn} onPress={() => { setFormat('mp4'); setStep('quality'); }}>
              <Text style={styles.optIcon}>🎬</Text>
              <Text style={styles.optTxt}>Video</Text>
              <Text style={styles.optSub}>MP4</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {step === 'quality' && !initialMode && (
              <TouchableOpacity onPress={() => { setStep('format'); setQuality(''); }} style={styles.backBtn}>
                <Text style={styles.backTxt}>← Geri</Text>
              </TouchableOpacity>
            )}
            <View style={styles.qualityList}>
              {qualities.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.qualBtn, quality === q && styles.qualBtnActive]}
                  onPress={() => setQuality(q)}
                >
                  <Text style={[styles.qualTxt, quality === q && styles.qualTxtActive]}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {message ? <Text style={styles.errorTxt}>{message}</Text> : null}
            <TouchableOpacity
              style={[styles.dlBtn, (!quality || loading) && styles.dlBtnDisabled]}
              onPress={handleDownload}
              disabled={!quality || loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.dlTxt}>İndir</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  authBlock: { alignItems: 'center' },
  authMsg: { color: '#888', marginBottom: 16, textAlign: 'center' },
  authBtn: { backgroundColor: '#1DB954', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  authBtnTxt: { color: '#fff', fontWeight: 'bold' },
  optionRow: { flexDirection: 'row', justifyContent: 'space-around' },
  optBtn: { flex: 1, alignItems: 'center', padding: 16, backgroundColor: '#2a2a2a', borderRadius: 12, marginHorizontal: 6 },
  optIcon: { fontSize: 32, marginBottom: 8 },
  optTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  optSub: { color: '#888', fontSize: 12, marginTop: 4 },
  backBtn: { marginBottom: 12 },
  backTxt: { color: '#1DB954', fontSize: 14 },
  qualityList: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 },
  qualBtn: { paddingHorizontal: 20, paddingVertical: 10, margin: 6, backgroundColor: '#2a2a2a', borderRadius: 20 },
  qualBtnActive: { backgroundColor: '#1DB954' },
  qualTxt: { color: '#888', fontSize: 14 },
  qualTxtActive: { color: '#fff', fontWeight: 'bold' },
  errorTxt: { color: '#FF6B6B', textAlign: 'center', marginBottom: 12 },
  dlBtn: { backgroundColor: '#1DB954', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  dlBtnDisabled: { opacity: 0.5 },
  dlTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
