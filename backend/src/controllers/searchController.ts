import { Request, Response, NextFunction } from 'express';
import { searchYouTube, getTrending, getChannelVideos } from '../services/ytdlpService.js';
import { normalizeQuery, truncateQuery } from '../utils/formatters.js';
import { AppError } from '../utils/errors.js';

const MAX_QUERY_LEN = 200;
const DEFAULT_LIMIT = 50;

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawQuery = String(req.query['q'] ?? '').trim();

    if (rawQuery.length < 2) {
      res.status(400).json({
        error: { code: 'QUERY_TOO_SHORT', message: 'Arama sorgusu en az 2 karakter olmalıdır', retryable: false },
      });
      return;
    }

    let truncated = false;
    let query = rawQuery;
    if (rawQuery.length > MAX_QUERY_LEN) {
      query = truncateQuery(rawQuery, MAX_QUERY_LEN);
      truncated = true;
    }

    const normalized = normalizeQuery(query);
    const limit = Math.min(Number(req.query['limit'] ?? DEFAULT_LIMIT), DEFAULT_LIMIT);
    const items = await searchYouTube(normalized, limit);

    res.status(200).json({
      items,
      totalCount: items.length,
      query: rawQuery,
      ...(truncated ? { warning: 'Sorgu 200 karakterde kesildi' } : {}),
    });
  } catch (err) {
    next(err);
  }
}

export async function trending(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = String(req.query['category'] ?? 'muzik');
    const page = Math.max(1, Number(req.query['page'] ?? 1));
    const items = await getTrending(category, page);
    res.status(200).json({ items, page, category });
  } catch (err) {
    next(err);
  }
}

export async function channelVideos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const channelId = Array.isArray(req.params['channelId'])
      ? req.params['channelId'][0]
      : req.params['channelId'];
    if (!channelId) {
      throw new AppError('MISSING_CHANNEL_ID', 'channelId gerekli', 400);
    }
    const page = Math.max(1, Number(req.query['page'] ?? 1));
    const items = await getChannelVideos(channelId, page);
    res.status(200).json({ items, page, channelId });
  } catch (err) {
    next(err);
  }
}
