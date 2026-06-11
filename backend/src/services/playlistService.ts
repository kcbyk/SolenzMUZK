import * as repo from '../repositories/playlistRepository.js';
import { AppError } from '../utils/errors.js';
import type { PlaylistRow, PlaylistItemRow } from '../repositories/playlistRepository.js';

export function validatePlaylistName(name: string): boolean {
  return name.length >= 1 && name.length <= 100;
}

async function assertOwnership(userId: string, playlistId: string): Promise<PlaylistRow> {
  const playlist = await repo.findById(playlistId);
  if (!playlist) throw new AppError('NOT_FOUND', 'Playlist bulunamadı', 404);
  if (playlist.user_id !== userId) throw new AppError('FORBIDDEN', 'Erişim reddedildi', 403);
  return playlist;
}

export async function getPlaylists(userId: string): Promise<PlaylistRow[]> {
  return repo.findByUserId(userId);
}

export async function createPlaylist(userId: string, name: string): Promise<PlaylistRow> {
  if (!validatePlaylistName(name)) {
    throw new AppError('INVALID_NAME', 'Playlist adı 1-100 karakter arasında olmalıdır', 400);
  }
  return repo.create(userId, name);
}

export async function updatePlaylist(userId: string, playlistId: string, name: string): Promise<PlaylistRow> {
  await assertOwnership(userId, playlistId);
  if (!validatePlaylistName(name)) {
    throw new AppError('INVALID_NAME', 'Playlist adı 1-100 karakter arasında olmalıdır', 400);
  }
  const updated = await repo.update(playlistId, name);
  if (!updated) throw new AppError('NOT_FOUND', 'Playlist bulunamadı', 404);
  return updated;
}

export async function deletePlaylist(userId: string, playlistId: string): Promise<void> {
  await assertOwnership(userId, playlistId);
  await repo.deletePlaylist(playlistId);
}

export async function getPlaylistItems(userId: string, playlistId: string): Promise<PlaylistItemRow[]> {
  await assertOwnership(userId, playlistId);
  return repo.findItems(playlistId);
}

export async function addToPlaylist(
  userId: string,
  playlistId: string,
  item: Omit<PlaylistItemRow, 'id' | 'playlist_id' | 'added_at' | 'position'>
): Promise<PlaylistItemRow> {
  await assertOwnership(userId, playlistId);
  const count = await repo.countItems(playlistId);
  if (count >= 500) {
    throw new AppError('PLAYLIST_FULL', 'Bu playlist maksimum kapasiteye ulaşmıştır', 409);
  }
  return repo.addItem(playlistId, { ...item, position: count + 1 });
}

export async function removeFromPlaylist(userId: string, playlistId: string, itemId: string): Promise<void> {
  await assertOwnership(userId, playlistId);
  await repo.removeItem(playlistId, itemId);
}

export async function reorderPlaylist(userId: string, playlistId: string, orderedItemIds: string[]): Promise<void> {
  await assertOwnership(userId, playlistId);
  await repo.reorderItems(playlistId, orderedItemIds);
}
