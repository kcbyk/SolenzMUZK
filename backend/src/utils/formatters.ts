/**
 * Normalize a search query:
 * - Trim whitespace
 * - Lowercase
 * - Replace Turkish characters with ASCII equivalents
 */
export function normalizeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'c')
    .replace(/Ş/g, 's')
    .replace(/Ğ/g, 'g');
}

/**
 * Truncate a query to max 200 characters.
 * Returns the input unchanged if <= 200 chars.
 */
export function truncateQuery(query: string, maxLen = 200): string {
  if (query.length <= maxLen) return query;
  return query.slice(0, maxLen);
}

/**
 * Format seconds to MM:SS (zero-padded).
 * e.g. 75 → "01:15"
 */
export function formatDuration(seconds: number): string {
  const totalSecs = Math.floor(Math.abs(seconds));
  const mm = Math.floor(totalSecs / 60);
  const ss = totalSecs % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/**
 * Format bytes to human-readable MB or GB (2 decimal places).
 * < 1 GiB → MB; >= 1 GiB → GB
 */
export function formatStorageSize(bytes: number): string {
  const MB = 1024 * 1024;
  const GB = 1024 * 1024 * 1024;
  if (bytes < GB) {
    return `${(bytes / MB).toFixed(2)} MB`;
  }
  return `${(bytes / GB).toFixed(2)} GB`;
}

/**
 * Calculate download progress percentage.
 * Returns floor((downloaded / total) * 100) clamped to 0-100.
 */
export function calculateProgress(bytesDownloaded: number, totalBytes: number): number {
  if (totalBytes <= 0) return 0;
  const pct = Math.floor((bytesDownloaded / totalBytes) * 100);
  return Math.min(100, Math.max(0, pct));
}
