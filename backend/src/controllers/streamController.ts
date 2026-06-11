import { Request, Response, NextFunction } from 'express';
import { getAudioStreamUrl, getVideoStreamUrl } from '../services/ytdlpService.js';
import { AppError } from '../utils/errors.js';

export async function getAudioUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawVideoId = req.params['videoId'];
    const videoId = Array.isArray(rawVideoId) ? rawVideoId[0] : rawVideoId;
    if (!videoId) throw new AppError('MISSING_VIDEO_ID', 'videoId gerekli', 400);
    const url = await getAudioStreamUrl(videoId);
    res.status(200).json({ url, videoId });
  } catch (err) {
    next(err);
  }
}

export async function getVideoUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawVideoId2 = req.params['videoId'];
    const videoId = Array.isArray(rawVideoId2) ? rawVideoId2[0] : rawVideoId2;
    if (!videoId) throw new AppError('MISSING_VIDEO_ID', 'videoId gerekli', 400);
    const quality = String(req.query['quality'] ?? '720p');
    const url = await getVideoStreamUrl(videoId, quality);
    res.status(200).json({ url, videoId, quality });
  } catch (err) {
    next(err);
  }
}
