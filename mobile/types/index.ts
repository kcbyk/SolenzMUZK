/**
 * Core TypeScript interfaces for MYT Müzik
 * Matches the data models defined in design.md
 */

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

export interface PlaylistItem extends ContentItem {
  position: number;
  addedAt: string; // ISO 8601
}

export interface UserAuth {
  id: string;
  email: string;
}
