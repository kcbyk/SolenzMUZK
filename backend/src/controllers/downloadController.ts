import { Request, Response, NextFunction } from 'express';
import * as downloadService from '../services/downloadService.js';
import { AppError } from '../utils/errors.js';
import { formatStorageSize } from '../utils/formatters.js';

export async function startDownload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { next(new AppError('UNAUTHORIZED', 'Authentication required', 401)); return; }

    const { videoId, format, quality, title, channelName, durationSec, thumbnailUrl } = req.body as {
      videoId: string; format: 'mp3' | 'aac' | 'mp4'; quality: string;
      title: string; channelName: string; durationSec: number; thumbnailUrl: string | null;
    };

    if (!videoId || !format || !quality) {
      res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'videoId, format, quality gerekli', retryable: false } });
      return;
    }

    const result = await downloadService.startDownload(userId, {
      videoId, format, quality,
      title: title ?? 'Bilinmiyor',
      channelName: channelName ?? 'Bilinmiyor',
      durationSec: durationSec ?? 0,
      thumbnailUrl: thumbnailUrl ?? null,
    });

    res.status(202).json({ ...result, message: 'İndirme başladı' });
  } catch (err) { next(err); }
}

export async function getDownloads(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { next(new AppError('UNAUTHORIZED', 'Authentication required', 401)); return; }
    const downloads = await downloadService.getUserDownloads(userId);
    res.status(200).json({ downloads });
  } catch (err) { next(err); }
}

export async function getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { next(new AppError('UNAUTHORIZED', 'Authentication required', 401)); return; }
    const { id } = req.params;
    if (!id) { next(new AppError('MISSING_ID', 'id gerekli', 400)); return; }

    // Verify ownership before opening SSE stream
    await downloadService.getDownload(userId, id);

    // Setup SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    downloadService.addSseClient(id, res);

    // Send current state immediately
    const download = await downloadService.getDownload(userId, id);
    res.write(`data: ${JSON.stringify({ downloadId: id, progressPct: download.progress_pct, status: download.status })}\n\n`);
  } catch (err) { next(err); }
}

export async function deleteDownload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { next(new AppError('UNAUTHORIZED', 'Authentication required', 401)); return; }
    const { id } = req.params;
    if (!id) { next(new AppError('MISSING_ID', 'id gerekli', 400)); return; }
    await downloadService.deleteDownload(userId, id);
    res.status(200).json({ message: 'İndirme silindi' });
  } catch (err) { next(err); }
}

export async function getStorageUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) { next(new AppError('UNAUTHORIZED', 'Authentication required', 401)); return; }
    const totalBytes = await downloadService.getTotalStorage(userId);
    res.status(200).json({ totalBytes, formatted: formatStorageSize(totalBytes) });
  } catch (err) { next(err); }
}
