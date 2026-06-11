import api from './api';

export async function getPlaylists() {
  const res = await api.get('/api/playlists');
  return res.data.playlists;
}

export async function createPlaylist(name: string) {
  const res = await api.post('/api/playlists', { name });
  return res.data.playlist;
}

export async function updatePlaylist(id: string, name: string) {
  const res = await api.put(`/api/playlists/${id}`, { name });
  return res.data.playlist;
}

export async function deletePlaylist(id: string) {
  await api.delete(`/api/playlists/${id}`);
}

export async function getPlaylistItems(id: string) {
  const res = await api.get(`/api/playlists/${id}/items`);
  return res.data.items;
}

export async function addToPlaylist(
  playlistId: string,
  item: {
    videoId: string;
    title: string;
    channelName: string;
    durationSec: number;
    thumbnailUrl: string | null;
  },
) {
  const res = await api.post(`/api/playlists/${playlistId}/items`, item);
  return res.data.item;
}

export async function removeFromPlaylist(playlistId: string, itemId: string) {
  await api.delete(`/api/playlists/${playlistId}/items/${itemId}`);
}
