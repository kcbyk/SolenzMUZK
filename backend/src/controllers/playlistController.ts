import { Request, Response, NextFunction } from 'express';
import * as playlistService from '../services/playlistService.js';
import { AppError } from '../utils/errors.js';

function getUserId(req: Request): string {
  const id = req.user?.userId;
  if (!id) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  return id;
}

function paramStr(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

export async function getPlaylists(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = getUserId(req);
    const playlists = await playlistService.getPlaylists(userId);
    res.status(200).json({ playlists });
  } catch (err) { next(err); }
}

export async function createPlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = getUserId(req);
    const { name } = req.body as { name: string };
    if (!name) { res.status(400).json({ error: { code: 'MISSING_NAME', message: 'name gerekli', retryable: false } }); return; }
    const playlist = await playlistService.createPlaylist(userId, name);
    res.status(201).json({ playlist });
  } catch (err) { next(err); }
}

export async function updatePlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = getUserId(req);
    const id = paramStr(req.params['id']);
    const { name } = req.body as { name: string };
    if (!id || !name) { res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'id ve name gerekli', retryable: false } }); return; }
    const playlist = await playlistService.updatePlaylist(userId, id, name);
    res.status(200).json({ playlist });
  } catch (err) { next(err); }
}

export async function deletePlaylist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = getUserId(req);
    const id = paramStr(req.params['id']);
    if (!id) { next(new AppError('MISSING_ID', 'id gerekli', 400)); return; }
    await playlistService.deletePlaylist(userId, id);
    res.status(200).json({ message: 'Playlist silindi' });
  } catch (err) { next(err); }
}

export async function getItems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = getUserId(req);
    const id = paramStr(req.params['id']);
    if (!id) { next(new AppError('MISSING_ID', 'id gerekli', 400)); return; }
    const items = await playlistService.getPlaylistItems(userId, id);
    res.status(200).json({ items });
  } catch (err) { next(err); }
}

export async function addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = getUserId(req);
    const id = paramStr(req.params['id']);
    if (!id) { next(new AppError('MISSING_ID', 'id gerekli', 400)); return; }
    const { videoId, title, channelName, durationSec, thumbnailUrl } = req.body as {
      videoId: string; title: string; channelName: string; durationSec: number; thumbnailUrl?: string | null;
    };
    if (!videoId || !title) { res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'videoId ve title gerekli', retryable: false } }); return; }
    const item = await playlistService.addToPlaylist(userId, id, {
      video_id: videoId, title, channel_name: channelName ?? 'Bilinmiyor',
      duration_sec: durationSec ?? 0, thumbnail_url: thumbnailUrl ?? null,
    });
    res.status(201).json({ item, message: 'İçerik eklendi' });
  } catch (err) { next(err); }
}

export async function removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = getUserId(req);
    const id = paramStr(req.params['id']);
    const itemId = paramStr(req.params['itemId']);
    if (!id || !itemId) { next(new AppError('MISSING_ID', 'id ve itemId gerekli', 400)); return; }
    await playlistService.removeFromPlaylist(userId, id, itemId);
    res.status(200).json({ message: 'İçerik kaldırıldı' });
  } catch (err) { next(err); }
}

export async function reorderItems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = getUserId(req);
    const id = paramStr(req.params['id']);
    const { orderedItemIds } = req.body as { orderedItemIds: string[] };
    if (!id) { next(new AppError('MISSING_ID', 'id gerekli', 400)); return; }
    if (!Array.isArray(orderedItemIds)) { res.status(400).json({ error: { code: 'INVALID_BODY', message: 'orderedItemIds array gerekli', retryable: false } }); return; }
    await playlistService.reorderPlaylist(userId, id, orderedItemIds);
    res.status(200).json({ message: 'Sıralama güncellendi' });
  } catch (err) { next(err); }
}
