export interface ContentItem {
  videoId: string;
  title: string;
  channelName: string;
  channelId?: string;
  durationSec: number;
  thumbnailUrl: string | null;
}

export interface SearchResult {
  items: ContentItem[];
  totalCount: number;
  query: string;
}

export interface DownloadRequest {
  videoId: string;
  format: 'mp3' | 'aac' | 'mp4';
  quality: '128kbps' | '192kbps' | '320kbps' | '360p' | '720p' | '1080p';
}

export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface AuthPayload {
  userId: string;
  email: string;
}

// Express augmentation
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
