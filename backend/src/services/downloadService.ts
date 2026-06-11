import PQueue from 'p-queue';
import { spawn } from 'child_process';
import * as downloadRepository from '../repositories/downloadRepository.js';
import { AppError } from '../utils/errors.js';
import type { Response } from 'express';
import type { DownloadRequest } from '../types/index.js';

const downloadQueue = new PQueue({ concurrency: 3 });

// SSE clients: downloadId → Set<Response>
const sseClients = new Map<string, Set<Response>>();

export function addSseClient(downloadId: string, res: Response): void {
  if (!sseClients.has(downloadId)) sseClients.set(downloadId, new Set());
  sseClients.get(downloadId)!.add(res);
  res.on('close', () => { sseClients.get(downloadId)?.delete(res); });
}

function broadcast(downloadId: string, data: object): void {
  const clients = sseClients.get(downloadId);
  if (!clients) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) client.write(payload);
}

export async function canAccept(userId: string): Promise<boolean> {
  const active = await downloadRepository.findActiveByUserId(userId);
  return active.length < 3;
}

type StartInput = DownloadRequest & {
  title: string;
  channelName: string;
  durationSec: number;
  thumbnailUrl: string | null;
};

export async function startDownload(userId: string, req: StartInput): Promise<{ downloadId: string }> {
  const existing = await downloadRepository.findByUserAndVideoId(userId, req.videoId);
  if (existing?.status === 'completed') {
    throw new AppError('ALREADY_DOWNLOADED', 'Bu içerik zaten indirildi', 409);
  }

  if (!(await canAccept(userId))) {
    throw new AppError('DOWNLOAD_LIMIT', 'En fazla 3 indirme aynı anda yapılabilir', 409);
  }

  const row = await downloadRepository.create({
    user_id: userId,
    video_id: req.videoId,
    title: req.title,
    channel_name: req.channelName,
    duration_sec: req.durationSec,
    thumbnail_url: req.thumbnailUrl,
    format: req.format,
    quality: req.quality,
    file_path: '',
    file_size_bytes: 0,
    status: 'pending',
    progress_pct: 0,
    bytes_downloaded: 0,
    error_message: null,
  });

  const downloadId = row.id;

  // Build yt-dlp args
  let formatStr: string;
  if (req.format === 'mp3' || req.format === 'aac') {
    formatStr = 'bestaudio';
  } else {
    const hm: Record<string, string> = {
      '360p': 'bestvideo[height<=360]+bestaudio',
      '720p': 'bestvideo[height<=720]+bestaudio',
      '1080p': 'bestvideo[height<=1080]+bestaudio',
    };
    formatStr = hm[req.quality] ?? 'bestvideo+bestaudio';
  }

  const ext = req.format === 'mp3' ? 'mp3' : req.format === 'aac' ? 'm4a' : 'mp4';
  const outputPath = `/tmp/myt-downloads/${userId}/${downloadId}.${ext}`;

  const args = [
    '-f', formatStr,
    '--newline',
    '--progress-template', '%(progress._percent_str)s\t%(progress._downloaded_bytes_str)s',
    '-o', outputPath,
    `https://www.youtube.com/watch?v=${req.videoId}`,
  ];
  if (req.format === 'mp3') args.push('--extract-audio', '--audio-format', 'mp3');
  else if (req.format === 'aac') args.push('--extract-audio', '--audio-format', 'm4a');

  // Enqueue — fire and forget (errors are caught internally)
  void downloadQueue.add(async () => {
    await downloadRepository.updateStatus(downloadId, 'downloading');

    await new Promise<void>((resolve, reject) => {
      const proc = spawn('yt-dlp', args);

      proc.stdout.on('data', (chunk: Buffer) => {
        const parts = chunk.toString().trim().split('\t');
        const pctStr = (parts[0] ?? '').replace('%', '').trim();
        const pct = parseFloat(pctStr);
        if (!isNaN(pct)) {
          const p = Math.min(100, Math.floor(pct));
          void downloadRepository.updateProgress(downloadId, p, 0);
          broadcast(downloadId, { downloadId, progressPct: p, status: 'downloading' });
        }
      });

      proc.on('close', async (code) => {
        if (code === 0) {
          await downloadRepository.markCompleted(downloadId, outputPath, 0);
          broadcast(downloadId, { downloadId, progressPct: 100, status: 'completed' });
          resolve();
        } else {
          await downloadRepository.updateStatus(downloadId, 'failed', `exit code ${code}`);
          broadcast(downloadId, { downloadId, status: 'failed' });
          reject(new Error(`yt-dlp exit ${code}`));
        }
      });

      proc.on('error', async (err) => {
        await downloadRepository.updateStatus(downloadId, 'failed', err.message);
        broadcast(downloadId, { downloadId, status: 'failed' });
        reject(err);
      });
    });
  });

  return { downloadId };
}

export async function getUserDownloads(userId: string) {
  return downloadRepository.findByUserId(userId);
}

export async function getDownload(userId: string, id: string) {
  const row = await downloadRepository.findById(id);
  if (!row) throw new AppError('NOT_FOUND', 'İndirme bulunamadı', 404);
  if (row.user_id !== userId) throw new AppError('FORBIDDEN', 'Erişim reddedildi', 403);
  return row;
}

export async function deleteDownload(userId: string, id: string): Promise<void> {
  const row = await downloadRepository.findById(id);
  if (!row) throw new AppError('NOT_FOUND', 'İndirme bulunamadı', 404);
  if (row.user_id !== userId) throw new AppError('FORBIDDEN', 'Erişim reddedildi', 403);
  await downloadRepository.deleteDownload(id);
}

export async function getTotalStorage(userId: string): Promise<number> {
  return downloadRepository.getTotalStorageByUserId(userId);
}
