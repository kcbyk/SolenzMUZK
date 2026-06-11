import { spawn } from 'child_process';
import { AppError } from './errors.js';

export interface YtdlpOptions {
  timeoutMs?: number; // default 30000
}

/**
 * Run yt-dlp with the given args. Returns trimmed stdout.
 * Throws AppError on known failures.
 */
export async function runYtdlp(
  args: string[],
  options: YtdlpOptions = {},
): Promise<string> {
  const { timeoutMs = 30_000 } = options;

  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new AppError('YTDLP_TIMEOUT', 'yt-dlp işlemi zaman aşımına uğradı', 502, true));
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      // Map known error patterns to AppError
      if (stderr.includes('Video unavailable') || stderr.includes('This video is not available')) {
        reject(new AppError('VIDEO_UNAVAILABLE', 'Video mevcut değil', 404, false));
      } else if (stderr.includes('HTTP Error 429') || stderr.includes('Too Many Requests')) {
        reject(new AppError('RATE_LIMITED', 'YouTube istek limiti aşıldı', 429, true));
      } else if (stderr.includes('Sign in to confirm') || stderr.includes('bot')) {
        reject(new AppError('YTDLP_BOT_DETECTION', 'YouTube bot algılaması', 503, true));
      } else {
        reject(new AppError('YTDLP_ERROR', `yt-dlp hatası: ${stderr.slice(0, 200)}`, 502, true));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new AppError('YTDLP_UNAVAILABLE', `yt-dlp bulunamadı: ${err.message}`, 502, true));
    });
  });
}
