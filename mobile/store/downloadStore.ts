import { create } from 'zustand';

export interface LocalDownload {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  durationSec: number;
  thumbnailUrl: string | null;
  format: 'mp3' | 'aac' | 'mp4';
  quality: string;
  localUri: string;
  fileSizeBytes: number;
  downloadedAt: string;
}

interface DownloadState {
  activeDownloads: Map<string, { progressPct: number; status: string }>;
  downloads: LocalDownload[];
  addActive: (id: string) => void;
  updateProgress: (id: string, pct: number, status: string) => void;
  removeActive: (id: string) => void;
  addCompleted: (download: LocalDownload) => void;
  removeDownload: (id: string) => void;
}

export const useDownloadStore = create<DownloadState>((set) => ({
  activeDownloads: new Map(),
  downloads: [],

  addActive: (id) =>
    set((s) => ({ activeDownloads: new Map(s.activeDownloads).set(id, { progressPct: 0, status: 'pending' }) })),

  updateProgress: (id, pct, status) =>
    set((s) => ({ activeDownloads: new Map(s.activeDownloads).set(id, { progressPct: pct, status }) })),

  removeActive: (id) =>
    set((s) => {
      const m = new Map(s.activeDownloads);
      m.delete(id);
      return { activeDownloads: m };
    }),

  addCompleted: (download) =>
    set((s) => ({ downloads: [download, ...s.downloads] })),

  removeDownload: (id) =>
    set((s) => ({ downloads: s.downloads.filter((d) => d.id !== id) })),
}));
