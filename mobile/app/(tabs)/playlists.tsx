import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  createPlaylist,
  deletePlaylist,
  getPlaylists,
} from '../../services/playlistService';
import { useAuthStore } from '../../store/authStore';

interface Playlist {
  id: string;
  name: string;
  itemCount?: number;
}

export default function PlaylistsScreen() {
  const { accessToken } = useAuthStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPlaylists();
      setPlaylists(data);
    } catch {
      // network error — keep current list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessToken) fetchPlaylists();
  }, [accessToken, fetchPlaylists]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (trimmed.length === 0) {
      setNameError('Playlist adı boş olamaz');
      return;
    }
    if (trimmed.length > 100) {
      setNameError('Playlist adı en fazla 100 karakter olabilir');
      return;
    }
    setCreating(true);
    try {
      const created = await createPlaylist(trimmed);
      setPlaylists((prev) => [created, ...prev]);
      setNewName('');
      setNameError('');
      setCreateVisible(false);
    } catch {
      setNameError('Playlist oluşturulamadı, tekrar deneyin');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Playlist\'i Sil',
      `"${name}" playlist'ini silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlaylist(id);
              setPlaylists((prev) => prev.filter((p) => p.id !== id));
            } catch {
              Alert.alert('Hata', 'Playlist silinemedi, tekrar deneyin.');
            }
          },
        },
      ],
    );
  };

  if (!accessToken) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTxt}>Playlist'lerinizi görmek için giriş yapın</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Playlist</Text>
        <TouchableOpacity
          onPress={() => { setNewName(''); setNameError(''); setCreateVisible(true); }}
          style={styles.addBtn}
          accessibilityLabel="Yeni playlist oluştur"
        >
          <Text style={styles.addTxt}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {!loading && playlists.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTxt}>Henüz playlist oluşturmadınız</Text>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(p) => p.id}
          renderItem={({ item: p }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => router.push(`/playlist/${p.id}`)}
              onLongPress={() => handleDelete(p.id, p.name)}
              activeOpacity={0.7}
            >
              <View style={styles.itemIcon}>
                <Text style={styles.itemIconTxt}>🎵</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.itemCount}>
                  {p.itemCount !== undefined ? `${p.itemCount} öğe` : '0 öğe'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(p.id, p.name)}
                style={styles.deleteBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.deleteTxt}>🗑</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Create Playlist Modal */}
      <Modal
        visible={createVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Yeni Playlist</Text>
            <TextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              placeholder="Playlist adı"
              placeholderTextColor="#555"
              value={newName}
              onChangeText={(t) => { setNewName(t); setNameError(''); }}
              maxLength={100}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            {nameError ? <Text style={styles.errorTxt}>{nameError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCreateVisible(false)}
              >
                <Text style={styles.cancelTxt}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, creating && styles.confirmBtnDisabled]}
                onPress={handleCreate}
                disabled={creating}
              >
                <Text style={styles.confirmTxt}>{creating ? '…' : 'Oluştur'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  heading: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTxt: { fontSize: 22, color: '#fff', lineHeight: 26 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTxt: { color: '#888', fontSize: 14, textAlign: 'center' },
  listContent: { paddingVertical: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemIconTxt: { fontSize: 22 },
  itemInfo: { flex: 1 },
  itemName: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  itemCount: { color: '#888', fontSize: 12 },
  deleteBtn: { padding: 8 },
  deleteTxt: { fontSize: 18 },
  sep: { height: 1, backgroundColor: '#1e1e1e', marginLeft: 76 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginBottom: 14 },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputError: { borderColor: '#FF6B6B' },
  errorTxt: { color: '#FF6B6B', fontSize: 12, marginTop: 4 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  cancelTxt: { color: '#888', fontSize: 14 },
  confirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1DB954',
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmTxt: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
