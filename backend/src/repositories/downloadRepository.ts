import pool from '../db/pool.js';

export interface DownloadRow {
  id: string;
  user_id: string;
  video_id: string;
  title: string;
  channel_name: string;
  duration_sec: number;
  thumbnail_url: string | null;
  format: 'mp3' | 'aac' | 'mp4';
  quality: string;
  file_path: string;
  file_size_bytes: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress_pct: number;
  bytes_downloaded: number;
  error_message: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
}

type CreateInput = Omit<DownloadRow, 'id' | 'created_at' | 'started_at' | 'completed_at'>;

export async function create(data: CreateInput): Promise<DownloadRow> {
  const result = await pool.query<DownloadRow>(
    `INSERT INTO downloads (user_id, video_id, title, channel_name, duration_sec, thumbnail_url, format, quality, file_path, file_size_bytes, status, progress_pct, bytes_downloaded, error_message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [data.user_id, data.video_id, data.title, data.channel_name, data.duration_sec,
     data.thumbnail_url, data.format, data.quality, data.file_path, data.file_size_bytes,
     data.status, data.progress_pct, data.bytes_downloaded, data.error_message],
  );
  const row = result.rows[0];
  if (!row) throw new Error('Failed to create download record');
  return row;
}

export async function findById(id: string): Promise<DownloadRow | null> {
  const result = await pool.query<DownloadRow>('SELECT * FROM downloads WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function findByUserId(userId: string): Promise<DownloadRow[]> {
  const result = await pool.query<DownloadRow>(
    'SELECT * FROM downloads WHERE user_id = $1 ORDER BY created_at DESC',
    [userId],
  );
  return result.rows;
}

export async function findActiveByUserId(userId: string): Promise<DownloadRow[]> {
  const result = await pool.query<DownloadRow>(
    "SELECT * FROM downloads WHERE user_id = $1 AND status IN ('pending', 'downloading')",
    [userId],
  );
  return result.rows;
}

export async function findByUserAndVideoId(userId: string, videoId: string): Promise<DownloadRow | null> {
  const result = await pool.query<DownloadRow>(
    'SELECT * FROM downloads WHERE user_id = $1 AND video_id = $2 ORDER BY created_at DESC LIMIT 1',
    [userId, videoId],
  );
  return result.rows[0] ?? null;
}

export async function updateProgress(id: string, progressPct: number, bytesDownloaded: number): Promise<void> {
  await pool.query(
    'UPDATE downloads SET progress_pct = $1, bytes_downloaded = $2 WHERE id = $3',
    [progressPct, bytesDownloaded, id],
  );
}

export async function updateStatus(id: string, status: DownloadRow['status'], errorMessage?: string): Promise<void> {
  if (status === 'downloading') {
    await pool.query(
      'UPDATE downloads SET status = $1, started_at = NOW() WHERE id = $2',
      [status, id],
    );
  } else {
    await pool.query(
      'UPDATE downloads SET status = $1, error_message = $2 WHERE id = $3',
      [status, errorMessage ?? null, id],
    );
  }
}

export async function markCompleted(id: string, filePath: string, fileSizeBytes: number): Promise<void> {
  await pool.query(
    "UPDATE downloads SET status = $1, file_path = $2, file_size_bytes = $3, progress_pct = 100, completed_at = NOW() WHERE id = $4",
    ['completed', filePath, fileSizeBytes, id],
  );
}

export async function deleteDownload(id: string): Promise<void> {
  await pool.query('DELETE FROM downloads WHERE id = $1', [id]);
}

export async function getTotalStorageByUserId(userId: string): Promise<number> {
  const result = await pool.query<{ total: string }>(
    "SELECT COALESCE(SUM(file_size_bytes), 0)::text AS total FROM downloads WHERE user_id = $1 AND status = 'completed'",
    [userId],
  );
  return parseInt(result.rows[0]?.total ?? '0', 10);
}
