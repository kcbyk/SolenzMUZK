import PQueue from 'p-queue';
import { runYtdlp } from '../utils/ytdlpWrapper.js';
import { AppError } from '../utils/errors.js';
import type { ContentItem } from '../types/index.js';

const queue = new PQueue({ concurrency: 5 });

/**
 * Wraps a yt-dlp call with exponential backoff for rate limiting.
 * Max 3 retries: delays 1s, 2s, 4s.
 */
async function withBackoff<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AppError && err.code === 'RATE_LIMITED' && attempt < 3) {
      const delayMs = Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, delayMs));
      return withBackoff(fn, attempt + 1);
    }
    throw err;
  }
}

/**
 * Parse tab-separated yt-dlp output lines into ContentItem[].
 * Expected columns: id\ttitle\tuploader\tduration\tthumbnail
 */
function parseTabOutput(raw: string): ContentItem[] {
  return raw
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const parts = line.split('\t');
      const videoId = parts[0]?.trim() ?? '';
      const title = parts[1]?.trim() ?? 'Bilinmiyor';
      const channelName = parts[2]?.trim() ?? 'Bilinmiyor';
      const durationRaw = parts[3]?.trim() ?? '0';
      const thumbnailUrl = parts[4]?.trim() || null;

      const durationSec =
        durationRaw === 'NA' || durationRaw === ''
          ? 0
          : parseInt(durationRaw, 10);

      return { videoId, title, channelName, durationSec, thumbnailUrl } satisfies ContentItem;
    })
    .filter((item) => item.videoId.length > 0);
}

export async function searchYouTube(query: string, limit = 50): Promise<ContentItem[]> {
  return queue.add(() =>
    withBackoff(() =>
      runYtdlp([
        `ytsearch${limit}:${query}`,
        '--no-playlist',
        '--print', '%(id)s\t%(title)s\t%(uploader)s\t%(duration)s\t%(thumbnail)s',
        '--no-warnings',
        '--quiet',
      ]).then(parseTabOutput)
    )
  ) as Promise<ContentItem[]>;
}

export async function getAudioStreamUrl(videoId: string): Promise<string> {
  return queue.add(() =>
    withBackoff(() =>
      runYtdlp([
        '--no-playlist',
        '-f', 'bestaudio',
        '--get-url',
        `https://www.youtube.com/watch?v=${videoId}`,
      ])
    )
  ) as Promise<string>;
}

export async function getVideoStreamUrl(videoId: string, quality: string): Promise<string> {
  const heightMap: Record<string, string> = {
    '360p': 'bestvideo[height<=360]+bestaudio',
    '720p': 'bestvideo[height<=720]+bestaudio',
    '1080p': 'bestvideo[height<=1080]+bestaudio',
  };
  const format = heightMap[quality] ?? 'bestvideo+bestaudio';

  return queue.add(() =>
    withBackoff(() =>
      runYtdlp([
        '--no-playlist',
        '-f', format,
        '--get-url',
        `https://www.youtube.com/watch?v=${videoId}`,
      ])
    )
  ) as Promise<string>;
}

export async function getTrending(category: string, page: number): Promise<ContentItem[]> {
  // yt-dlp trending by category search approach
  const categoryQuery = category === 'muzik' ? 'music trending' : `${category} trending`;
  const pageSize = 20;
  const offset = (page - 1) * pageSize;
  const limit = offset + pageSize;

  return queue.add(() =>
    withBackoff(() =>
      runYtdlp([
        `ytsearch${limit}:${categoryQuery}`,
        '--no-playlist',
        '--print', '%(id)s\t%(title)s\t%(uploader)s\t%(duration)s\t%(thumbnail)s',
        '--no-warnings',
        '--quiet',
      ]).then((raw) => parseTabOutput(raw).slice(offset))
    )
  ) as Promise<ContentItem[]>;
}

export async function getChannelVideos(channelId: string, page: number): Promise<ContentItem[]> {
  const pageSize = 20;
  const start = (page - 1) * pageSize + 1;
  const end = page * pageSize;

  return queue.add(() =>
    withBackoff(() =>
      runYtdlp([
        '--flat-playlist',
        '--print', '%(id)s\t%(title)s\t%(uploader)s\t%(duration)s\t%(thumbnail)s',
        '--playlist-start', String(start),
        '--playlist-end', String(end),
        '--no-warnings',
        '--quiet',
        `https://www.youtube.com/@${channelId}/videos`,
      ]).then(parseTabOutput)
    )
  ) as Promise<ContentItem[]>;
}

export async function getVideoDownloadUrl(
  videoId: string,
  format: string,
  quality: string,
): Promise<string> {
  let formatStr: string;
  if (format === 'mp3' || format === 'aac') {
    formatStr = 'bestaudio';
  } else {
    const heightMap: Record<string, string> = {
      '360p': 'bestvideo[height<=360]+bestaudio',
      '720p': 'bestvideo[height<=720]+bestaudio',
      '1080p': 'bestvideo[height<=1080]+bestaudio',
    };
    formatStr = heightMap[quality] ?? 'bestvideo+bestaudio';
  }

  return queue.add(() =>
    withBackoff(() =>
      runYtdlp([
        '--no-playlist',
        '-f', formatStr,
        '--get-url',
        `https://www.youtube.com/watch?v=${videoId}`,
      ])
    )
  ) as Promise<string>;
}
